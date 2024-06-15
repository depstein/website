import { Component, OnInit } from '@angular/core';
import * as labmembers from '../../assets/labmembers.json';

@Component({
  selector: 'app-pielab',
  templateUrl: './pielab.component.html',
  styleUrls: ['./pielab.component.css']
})
export class PielabComponent implements OnInit {
	public phdStudents: any[] = [];
	public msStudents: any[] = [];
	public bsStudents: any[] = [];
	public alumni: any[] = [];
	public phdAlumni: any[] = [];

  constructor() { }

  ngOnInit(): void {
  	(labmembers as any).default.forEach(member => {
  		if('alum' in member && member.alum) {
  			//For now, no classification for alumni
			if(member.type == "phd") {
				this.phdAlumni.push(member);
			} else {
				this.alumni.push(member);
			}
  		} else {
  			if(member.type == "phd") {
	  			this.phdStudents.push(member);
	  		} else if(member.type == "ms") {
	  			this.msStudents.push(member);
	  		} else {
	  			this.bsStudents.push(member);
	  		}
  		}
  	});
  	//Sort each alphabetically
  	this.phdStudents.sort(this.sortLabMembers);
  	this.msStudents.sort(this.sortLabMembers);
  	this.bsStudents.sort(this.sortLabMembers);
  	this.alumni.sort(this.sortLabMembers);
	this.phdAlumni.sort(this.sortLabMembers);
  }

  sortLabMembers(a:any, b:any):number {
		//Sort by last name
  	let aNames = a['name'].split(' ');
  	let bNames = b['name'].split(' ');
  	return aNames[aNames.length - 1].toLowerCase() < bNames[bNames.length - 1].toLowerCase()? -1 : 1;
  }
}
