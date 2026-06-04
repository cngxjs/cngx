import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-sample-toast-body',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul style="margin:0;padding:0 0 0 16px;font-size:0.8125rem;line-height:1.4">
      @for (field of fields(); track field) {
        <li>{{ field }}</li>
      }
    </ul>
  `,
})
export class SampleToastBody {
  readonly fields = input<string[]>([]);
}
