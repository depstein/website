import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { ParsePublicationsService } from '../parse-publications.service';

@Component({
  selector: 'app-publications',
  templateUrl: './publications.component.html',
  styleUrls: ['./publications.component.css']
})
export class PublicationsComponent implements OnInit {
	publicationTypes:any[] = [{type:"conference", name:"Conference papers"}, {type:"journal", name:"Journal articles"}, {type:"workshop", name:"Lightly reviewed publications"}, {type:"book", name:"Books and book chapters"}];
  allPublications;
	publications;
  checked = {journal:true, conference:true, workshop:false, book:true};

  constructor(private pubs:ParsePublicationsService, private route: ActivatedRoute, private router: Router) {
    this.route.paramMap.subscribe(params => {
      if(params.get('filter') == 'all') {
        this.checked.journal = true;
        this.checked.conference = true;
        this.checked.workshop = true;
        this.checked.book = true;
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
    Object.keys(this.checked).forEach((key) => {
      if(this.checked[key]) {
        allowedList = allowedList.concat(ParsePublicationsService.MAPPING[key]);
      }
    });
  	this.publications = this.allPublications.filter((pub) => {
  		return allowedList.includes(pub.type);
  	});
  }

}
