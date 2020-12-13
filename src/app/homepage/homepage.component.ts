import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ParsePublicationsService } from '../parse-publications.service';
import moment from 'moment';
import * as news from '../../assets/news.json';
import * as travel from '../../assets/travel.json';
import * as labmembers from '../../assets/labmembers.json';

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
  phdStudents;

  constructor(private http:HttpClient, private pubs:ParsePublicationsService) {
		this.setNews((news as any).default);
    this.setTravel((travel as any).default);
    this.setStudents((labmembers as any).default);
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
    //Subtract a day so that today's events still show up as future
  	this.priorTravel = tvl.filter(t => {
  		return moment(t['endDate'], "MMM DD YYYY") < moment().subtract(1, "days");
  	});
  	this.priorTravel = this.priorTravel.slice(0, 5).reverse();
  	//Display all future travel in ascending order
  	this.futureTravel = tvl.filter(t => {
  		return moment(t['endDate'], "MMM DD YYYY") >= moment().subtract(1, "days");
  	});
  	this.futureTravel = this.futureTravel.reverse();
  }

  setStudents(students:[]) {
    this.phdStudents = students.filter((s) => {return s['type'] == "phd"});
    this.phdStudents.sort((a, b) => {
      //Sort by last name
      let aNames = a['name'].split(' ');
      let bNames = b['name'].split(' ');
      return aNames[aNames.length - 1].toLowerCase() < bNames[bNames.length - 1].toLowerCase()? -1 : 1;
    });
  }
}
