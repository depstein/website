import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { HomepageComponent } from './homepage/homepage.component';
import { PublicationsComponent } from './publications/publications.component';
import { ProjectsComponent } from './projects/projects.component';
import { TeachingComponent } from './teaching/teaching.component';
import { PielabComponent } from './pielab/pielab.component';

const routes: Routes = [
	{ path: '', component: HomepageComponent},
	{ path: 'publications/:filter', component: PublicationsComponent},
	{ path: 'publications', component: PublicationsComponent},
	{ path: 'projects', component: ProjectsComponent},
	{ path: 'teaching', component: TeachingComponent},
	{ path: 'pielab', component: PielabComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
