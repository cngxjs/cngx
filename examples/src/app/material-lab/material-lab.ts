import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';

import { CngxMultiSelect, type CngxSelectOptionDef } from '@cngx/forms/select';

/**
 * Local Material-bridge fidelity harness (not generated, not shipped). Renders
 * the cngx multi-select with the working-tree Material bridge next to a real
 * Angular Material `mat-select`/`mat-form-field` under the same M3 azure theme,
 * so computed styles (option height, padding, font-size, outline, chip size)
 * can be compared directly. Route: `/#/material-lab`.
 */
@Component({
  selector: 'app-material-lab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [FormsModule, MatFormFieldModule, MatSelectModule, MatChipsModule, CngxMultiSelect],
  styleUrl: './material-lab.scss',
  template: `
    <div class="lab mat-app-background mat-typography">
      <section>
        <h3>cngx (Material bridge)</h3>
        <cngx-multi-select
          class="probe-cngx"
          [label]="'Colors'"
          [options]="colors"
          [(values)]="cngxValues"
          [clearable]="true"
          [chipOverflow]="'truncate'"
          placeholder="Pick colors…"
        />
      </section>

      <section>
        <h3>Angular Material</h3>
        <mat-form-field appearance="outline">
          <mat-label>Colors</mat-label>
          <mat-select multiple [(ngModel)]="matValues" class="probe-mat">
            @for (c of colors; track c.value) {
              <mat-option [value]="c.value">{{ c.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-chip-set>
          @for (v of matValues; track v) {
            <mat-chip>{{ labelOf(v) }}</mat-chip>
          }
        </mat-chip-set>
      </section>
    </div>
  `,
})
export class MaterialLab {
  protected readonly colors: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
    { value: 'amber', label: 'Amber' },
    { value: 'violet', label: 'Violet' },
  ];
  protected readonly cngxValues = signal<string[]>(['red', 'green']);
  protected matValues: string[] = ['red', 'green'];

  protected labelOf(value: string): string {
    return this.colors.find((c) => c.value === value)?.label ?? value;
  }
}
