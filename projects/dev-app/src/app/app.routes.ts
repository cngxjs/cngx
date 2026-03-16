import { type Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { TreetableDemoComponent } from './demos/treetable-demo/treetable-demo.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'treetable', component: TreetableDemoComponent },
  { path: '**', redirectTo: '' }
];
