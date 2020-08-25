import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as bibtex from 'bibtex-parse-js';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class ParsePublicationsService {
	private publicationList:any[];
	private allPublications:any[] = [];
	public static readonly ARCHIVAL:string[] = ['paper', 'note', 'journal', 'bookchapter'];
	public static readonly MAPPING:{} = {'paper':['paper', 'note'], 'journal':['journal'], 'workshop':['organizer', 'wip', 'workshop', 'poster', 'panel'], 'book':['dissertation', 'bookchapter']};


  constructor(private http:HttpClient) {
  }

  getPublications():Observable<any[]> {
  	return new Observable((observer) => {
  		this.http.get('./assets/publications.json').subscribe(pubs => {
  			this.publicationList = pubs as [];
	  		this.publicationList.forEach(pub => {
	  			let pubURL = './assets/bibtex/' + pub['key'] + '.bib';
	  			this.http.get(pubURL, {responseType: 'text'}).subscribe(bib => {
	  				this.addBib(bibtex.toJSON(bib), pubURL, pub);
	  				observer.next(this.allPublications);
	  			});
	  		});
	  	});
  		return {unsubscribe() {}};
  	})
  }

  addBib(bib, url, labels) {
  	bib = Object.assign({}, bib[0].entryTags, labels);
	bib['bib'] = url;
	bib.author = bib.author.split(" and ").map(function(n) {return n.split(",").reverse().join(' ').replace(/ /g, "\xa0").trim()}); //reverse hack will work in all trivial cases, e.g. Epstein, Daniel A.
	if('booktitle' in bib) { //Most of my publications have a book title field (e.g., conference publications).
		bib.booktitle = bib.booktitle.replace(/\\/g, "").replace(/#38;/g, "");
		//Put organizer roles in parantheses, because the series often includes "adjunct" or "extended abstracts"
		if(bib.booktitle.includes('Organizer')) {
			bib.booktitle = '(' + bib.booktitle + ')';
		}
	}
	if('journal' in bib) { //A few have journals instead.
		bib.journal = bib.journal.replace(/\\/g, "").replace(/#38;/g, "");
	}
	if('series' in bib) {
		bib.series = bib.series.replace(/'/g, 20); // '15 -> 2015
	}
	this.allPublications.push(bib);
	//TODO: This operation is not a problem as long as I have few publications, but could start taking longer...
	this.allPublications.sort((a, b) => {
		return this.publicationList.findIndex(f => f.key == a.key) < this.publicationList.findIndex(f => f.key == b.key) ? -1 : 1;
	});
  }
}
