import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as bibtex from 'bibtex-parse-js';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class ParsePublicationsService {
	private publicationList:any[] = [];
	public static readonly ARCHIVAL:string[] = ['paper', 'note', 'journal', 'bookchapter'];
	public static readonly MAPPING:{} = {'paper':['paper', 'note'], 'journal':['journal'], 'workshop':['organizer', 'wip', 'workshop', 'poster', 'panel', "demo"], 'book':['dissertation', 'bookchapter']};


  constructor(private http:HttpClient) {
  }

  getPublications():Observable<any[]> {
  	return new Observable((observer) => {
  		this.http.get('./assets/publications.json').subscribe((pubs:any[]) => {
  			let pubCount = 0;
  			pubs.forEach(pub => {
  				let entry = {};
  				//Add the entry, the fields will be updated by the asynchronous bibtex calls.
  				this.publicationList.push(entry);
  				observer.next(this.publicationList);
  				let pubURL = './assets/bibtex/' + pub['key'] + '.bib';
  				this.http.get(pubURL, {responseType: 'text'}).subscribe((bib:any) => {
	  				bib = bibtex.toJSON(bib);
	  				bib = Object.assign({}, bib[0]['entryTags'], pub);
					bib['bib'] = pubURL;
					bib['author'] = bib['author'].split(" and ").map(function(n) {return n.split(",").reverse().join(' ').replace(/ /g, "\xa0").trim()}); //reverse hack will work in all trivial cases, e.g. Epstein, Daniel A.
					if('booktitle' in bib) { //Most of my publications have a book title field (e.g., conference publications).
						bib['booktitle'] = bib['booktitle'].replace(/\\/g, "").replace(/#38;/g, "");
					}
					if('journal' in bib) { //A few have journals instead.
						bib['journal'] = bib['journal'].replace(/\\/g, "").replace(/#38;/g, "");
					}
					if('series' in bib) {
						bib['series'] = bib['series'].replace(/'/g, 20); // '15 -> 2015
					}
					if('doi' in bib && !('url' in bib)) {
						bib['url'] = 'http://doi.org/' + bib['doi'];
					}
					Object.keys(bib).forEach(b => { //shallow copy into the entry and notify the observable
						entry[b] = bib[b];
					});
					observer.next(this.publicationList);
					pubCount++;
					if(pubCount == pubs.length) {
						observer.complete();
					}
	  			});
  			});
	  	});
  		return {unsubscribe() {}};
  	})
  }
}
