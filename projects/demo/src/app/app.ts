import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CxCore } from '@cngx/core';
@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  imports: [CxCore, RouterOutlet],
})
export class App {
  protected title = 'dev-app';
}

