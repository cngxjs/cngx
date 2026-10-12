import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CngxCard, CNGX_CARD_CONFIG } from '@cngx/common/card';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CngxCard],
  providers: [{ provide: CNGX_CARD_CONFIG, useValue: { elevated: true } }],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('fixture-app');
}
