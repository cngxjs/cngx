import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'cx-core',
  imports: [],
  templateUrl: './core.html',
  styleUrl: './core.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxCore {}
