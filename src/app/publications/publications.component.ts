import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { ParsePublicationsService } from '../parse-publications.service';

@Component({
  selector: 'app-publications',
  templateUrl: './publications.component.html',
  styleUrls: ['./publications.component.css']
})
export class PublicationsComponent implements OnInit {
	allPublications;
	publications;
	journal:boolean = true;
	conference:boolean = true;
	workshop:boolean = false;
	book:boolean = true;

  constructor(private pubs:ParsePublicationsService, private route: ActivatedRoute, private router: Router) {
    this.route.paramMap.subscribe(params => {
      if(params.get('filter') == 'all') {
        this.journal = true;
        this.conference = true;
        this.workshop = true;
        this.book = true;
      }
      //One could imagine other filters here, but none are currently implemented
    });
    this.pubs.getPublications().subscribe(allPubs => {
  		this.allPublications = allPubs;
  		this.filterPublications();
  	});
  }

  ngOnInit() {
  	
  }

  filterPublications() {
  	let allowedList = [];
  	if(this.journal) {
  		allowedList = allowedList.concat(ParsePublicationsService.MAPPING['journal']);
  	}
  	if(this.conference) {
  		allowedList = allowedList.concat(ParsePublicationsService.MAPPING['paper']);
  	}
  	if(this.workshop) {
  		allowedList = allowedList.concat(ParsePublicationsService.MAPPING['workshop']);
  	}
  	if(this.book) {
  		allowedList = allowedList.concat(ParsePublicationsService.MAPPING['book']);
  	}
  	//this.allPublications.filter()
  	this.publications = this.allPublications.filter((pub) => {
  		return allowedList.includes(pub.type);
  	});
  }

}