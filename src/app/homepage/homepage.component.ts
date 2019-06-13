import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ParsePublicationsService } from '../parse-publications.service';
import * as moment from 'moment';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {
	news;
	priorTravel;
	futureTravel;
	publications;

  constructor(private http:HttpClient, private pubs:ParsePublicationsService) {
  	this.http.get('./assets/news.json').subscribe(news => {
  		this.setNews(news as []);

  	});
  	this.http.get('./assets/travel.json').subscribe(travel => {
  		this.setTravel(travel as []);
  	});
  	this.pubs.getPublications().subscribe(allPubs => {
  		this.publications = allPubs.filter((p) => {
  			return ParsePublicationsService.ARCHIVAL.includes(p.type);
  		});
  	});
  }

  ngOnInit() {
  }

  setNews(news:[]) {
  	//Display the 5 most recent news items
  	this.news = news.slice(0, 5);
  }

  setTravel(travel:[]) {
  	let tvl = travel.map(t => {
  		let newT = t as Object;
  		let startDate = moment(t['startDate'], "MMM DD YYYY");
  		let endDate = moment(t['endDate'], "MMM DD YYYY");
  		if(startDate.day() == endDate.day() && startDate.month() == endDate.month()) {
  			//Display "Month Date"
  			newT['formattedDate'] = startDate.format("MMMM D");
  		}
  		else if(startDate.month() == endDate.month()) {
  			//Display "Month Date-Date"
  			newT['formattedDate'] = startDate.format("MMMM D") + '-' + endDate.format("D");
  		}
  		else {
  			//Display "Month Date-Month Date"
  			newT['formattedDate'] = startDate.format("MMMM D") + '-' + endDate.format("MMMM D");
  		}
  		return newT;
  	});
  	//Display up to 5 past travel items in ascending order
  	this.priorTravel = tvl.filter(t => {
  		return moment(t['endDate'], "MMM DD YYYY") < moment();
  	});
  	this.priorTravel = this.priorTravel.slice(0, 5).reverse();
  	//Display all future travel in ascending order
  	this.futureTravel = tvl.filter(t => {
  		return moment(t['endDate'], "MMM DD YYYY") >= moment();
  	});
  	this.futureTravel = this.futureTravel.reverse();
  }

}
