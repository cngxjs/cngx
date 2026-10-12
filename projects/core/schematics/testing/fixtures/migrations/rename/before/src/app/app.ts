import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CngxOldCard, CNGX_OLD_CARD_CONFIG } from '@cngx/common/old-card';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CngxOldCard],
  providers: [{ provide: CNGX_OLD_CARD_CONFIG, useValue: { elevated: true } }],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('fixture-app');
}
