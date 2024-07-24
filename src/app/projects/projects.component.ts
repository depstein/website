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
  clinicalPublications:any[];
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
  		return ['cscw24a', 'chi24d', 'chi23a', 'cscw22b', 'chi22a', 'cscw21a','jmh21','dis21b','chi21a', 'chi21b', 'cscw20b', 'chi17a', 'chi16c', 'ubi15', 'chi15'].includes(pub['key']);
  	});

  	this.designPublications = this.allPublications.filter((pub:{}) => {
  		return ['chi24a', 'imwut24', 'mobilehci23', 'imwut22', 'imwut21','dis21a', 'ubi16', 'chi16a', 'dis14', 'pervasivehealth20'].includes(pub['key']);
  	});

  	this.socialPublications = this.allPublications.filter((pub:{}) => {
  		return ['cscw24c', 'chi23c', 'cscw22d', 'cscw21c', 'cscw20a', 'gi20', 'cscw17_online', 'chi16b', 'cscw15', 'ubi13'].includes(pub['key']);
  	});

    this.clinicalPublications = this.allPublications.filter((pub:{}) => {
      return ['cscw24b', 'chi24c', 'jmh23', 'chi23b','chi22b', 'cscw22a', 'cscw21b', 'dis18', 'chi17b'].includes(pub['key']);
    });

    this.reflectingPublications = this.allPublications.filter((pub:{}) => {
      return ['chi24b', 'cscw22c', 'pervasive21','imwut20', 'health20', 'pervasive17'].includes(pub['key']);
    });
  }
}
