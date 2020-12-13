import { Component, OnInit } from '@angular/core';
import { ParsePublicationsService } from '../parse-publications.service';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit {
	allPublications:any[];
	practicesPublications:any[];
	designPublications:any[];
	socialPublications:any[];
  reflectingPublications:any[];

  constructor(private pubs:ParsePublicationsService) {
  	this.pubs.getPublications().subscribe(allPubs => {
  		this.allPublications = allPubs;
  		this.filterPublications();
  	});
  }

  ngOnInit() {
  }

  filterPublications() {
  	this.practicesPublications = this.allPublications.filter((pub:{}) => {
  		return ['chi21a', 'chi21b', 'cscw20b', 'dis18', 'chi17a', 'chi16c', 'ubi15', 'chi15'].includes(pub['key']);
  	});

  	this.designPublications = this.allPublications.filter((pub:{}) => {
  		return ['chi17b', 'ubi16', 'chi16a', 'dis14', 'pervasivehealth20'].includes(pub['key']);
  	});

  	this.socialPublications = this.allPublications.filter((pub:{}) => {
  		return ['cscw20a', 'gi20', 'cscw17_online', 'chi16b', 'cscw15', 'ubi13'].includes(pub['key']);
  	});

    this.reflectingPublications = this.allPublications.filter((pub:{}) => {
      return ['imwut20', 'health20', 'pervasive17'].includes(pub['key']);
    });
  }
}
