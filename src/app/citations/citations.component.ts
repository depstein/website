import { Component, Input, OnInit } from '@angular/core';
import { trigger, state, style, animate, transition} from '@angular/animations';

@Component({
  selector: 'app-citations',
  templateUrl: './citations.component.html',
  styleUrls: ['./citations.component.css'],
  animations: [
    // the fade-in/fade-out animation.
    trigger('fade', [

      // the "in" style determines the "resting" state of the element when it is visible.
      state('in', style({opacity: 1, height:'*'})),

      // fade in when created. this could also be written as transition('void => *')
      transition(':enter', [
        style({opacity: 0, height:0}),
        animate(200 )
      ]),

      // fade out when destroyed. this could also be written as transition('void => *')
      transition(':leave',
        animate(200, style({opacity: 0, height:0})))
    ]),
  ]
})
export class CitationsComponent implements OnInit {
	@Input() publications:[]
	@Input() displayYears:boolean;
  @Input() animate:boolean;

  constructor() { }

  ngOnInit() {
  }

}
