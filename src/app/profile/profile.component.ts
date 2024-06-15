import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
	@Input() student:any;
	@Input() showPicture:boolean = true;
  phdAlum:boolean = false

  constructor() { }

  ngOnInit(): void {
  }

}
