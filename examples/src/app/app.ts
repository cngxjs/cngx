import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CngxBannerOutlet, CngxToastOutlet } from '@cngx/ui/feedback';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, CngxBannerOutlet, CngxToastOutlet],
  templateUrl: './app.html',
})
export class App {}
