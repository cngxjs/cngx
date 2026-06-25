import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';

import {
  CngxSelect,
  CngxMultiSelect,
  CngxCombobox,
  CngxTypeahead,
  CngxTreeSelect,
  CngxReorderableMultiSelect,
  CngxActionSelect,
  CngxActionMultiSelect,
  CngxSelectShell,
  CngxSelectOption,
  type CngxSelectOptionDef,
} from '@cngx/forms/select';
import type { CngxTreeNode } from '@cngx/utils';

/**
 * Local Material-bridge fidelity harness (not generated, not shipped). Renders
 * every cngx select-family variant with the working-tree Material bridge, side
 * by side with a real Angular Material counterpart wherever a clean equivalent
 * exists, under the same M3 azure theme. This is the only working-tree-faithful
 * preview of the bridge: the SCSS `@use`s the bridge via relative source paths,
 * whereas the compodocx StackBlitz playgrounds pin published rc.3.
 * Route: `/#/material-lab`.
 */
@Component({
  selector: 'app-material-lab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatInputModule,
    CngxSelect,
    CngxMultiSelect,
    CngxCombobox,
    CngxTypeahead,
    CngxTreeSelect,
    CngxReorderableMultiSelect,
    CngxActionSelect,
    CngxActionMultiSelect,
    CngxSelectShell,
    CngxSelectOption,
  ],
  styleUrl: './material-lab.scss',
  template: `
    <div class="lab mat-app-background mat-typography">
      <section>
        <h3>single-select</h3>
        <cngx-select
          class="probe-cngx"
          [label]="'Favorite color'"
          [options]="colors"
          [(value)]="singleValue"
          [clearable]="true"
          [selectionIndicatorPosition]="'after'"
          placeholder="Pick a color..."
        />

        <mat-form-field appearance="outline">
          <mat-label>Favorite color</mat-label>
          <mat-select [(ngModel)]="matSingleValue" class="probe-mat">
            @for (c of colors; track c.value) {
              <mat-option [value]="c.value">{{ c.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </section>

      <section>
        <h3>multi-select</h3>
        <cngx-multi-select
          class="probe-cngx"
          [label]="'Favorite colors'"
          [options]="colors"
          [(values)]="multiValues"
          [clearable]="true"
          [chipOverflow]="'truncate'"
          placeholder="Pick a few colors..."
        />

        <mat-form-field appearance="outline">
          <mat-label>Favorite colors</mat-label>
          <mat-select multiple [(ngModel)]="matMultiValues" class="probe-mat">
            @for (c of colors; track c.value) {
              <mat-option [value]="c.value">{{ c.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-chip-set>
          @for (v of matMultiValues; track v) {
            <mat-chip>{{ labelOf(v) }}</mat-chip>
          }
        </mat-chip-set>
      </section>

      <section>
        <h3>typeahead</h3>
        <cngx-typeahead
          class="probe-cngx"
          [label]="'Favorite color'"
          [options]="colors"
          [(value)]="typeaheadValue"
          [displayWith]="displayWith"
          placeholder="Type to filter..."
        />

        <mat-form-field appearance="outline">
          <mat-label>Favorite color</mat-label>
          <input
            matInput
            class="probe-mat"
            [(ngModel)]="matTypeaheadText"
            [matAutocomplete]="typeaheadAuto"
            placeholder="Type to filter..."
          />
          <mat-autocomplete #typeaheadAuto="matAutocomplete">
            @for (c of colors; track c.value) {
              <mat-option [value]="c.label">{{ c.label }}</mat-option>
            }
          </mat-autocomplete>
        </mat-form-field>
      </section>

      <section>
        <h3>combobox</h3>
        <cngx-combobox
          class="probe-cngx"
          [label]="'Favorite colors'"
          [options]="colors"
          [(values)]="comboboxValues"
          placeholder="Type to filter..."
        />

        <mat-form-field appearance="outline">
          <mat-label>Favorite colors</mat-label>
          <mat-chip-grid #comboboxGrid class="probe-mat">
            @for (v of matComboboxValues; track v) {
              <mat-chip-row>{{ labelOf(v) }}</mat-chip-row>
            }
          </mat-chip-grid>
          <input
            placeholder="Type to filter..."
            [matChipInputFor]="comboboxGrid"
            [matAutocomplete]="comboboxAuto"
          />
          <mat-autocomplete #comboboxAuto="matAutocomplete">
            @for (c of colors; track c.value) {
              <mat-option [value]="c.value">{{ c.label }}</mat-option>
            }
          </mat-autocomplete>
        </mat-form-field>
      </section>

      <section>
        <h3>tree-select (cngx only)</h3>
        <cngx-tree-select
          class="probe-cngx"
          [label]="'Regions'"
          [nodes]="nodes"
          [nodeIdFn]="nodeIdFn"
          [(values)]="treeValues"
          [cascadeChildren]="true"
          placeholder="Pick regions..."
        />
      </section>

      <section>
        <h3>reorderable-multi-select (cngx only)</h3>
        <cngx-reorderable-multi-select
          class="probe-cngx"
          [label]="'Workflow steps'"
          [options]="steps"
          [(values)]="reorderableValues"
          placeholder="Pick steps..."
        />
      </section>

      <section>
        <h3>action-select (cngx only)</h3>
        <cngx-action-select
          class="probe-cngx"
          [label]="'Favorite color'"
          [options]="colors"
          [(value)]="actionValue"
          [clearable]="true"
          placeholder="Pick a color..."
        />
      </section>

      <section>
        <h3>action-multi-select (cngx only)</h3>
        <cngx-action-multi-select
          class="probe-cngx"
          [label]="'Favorite colors'"
          [options]="colors"
          [(values)]="actionMultiValues"
          [clearable]="true"
          [chipOverflow]="'truncate'"
          placeholder="Pick colors..."
        />
      </section>

      <section>
        <h3>select-shell (cngx only)</h3>
        <cngx-select-shell
          class="probe-cngx"
          [label]="'Favorite color'"
          [(value)]="shellValue"
          placeholder="Pick a color..."
        >
          <cngx-option [value]="'red'">Red</cngx-option>
          <cngx-option [value]="'green'">Green</cngx-option>
          <cngx-option [value]="'blue'">Blue</cngx-option>
          <cngx-option [value]="'amber'">Amber</cngx-option>
          <cngx-option [value]="'violet'">Violet</cngx-option>
        </cngx-select-shell>
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

  protected readonly steps: CngxSelectOptionDef<string>[] = [
    { value: 'build', label: 'Build' },
    { value: 'test', label: 'Test' },
    { value: 'deploy', label: 'Deploy' },
    { value: 'lint', label: 'Lint' },
    { value: 'release', label: 'Release' },
  ];

  protected readonly nodes: CngxTreeNode<string>[] = [
    {
      value: 'europe',
      label: 'Europe',
      children: [
        { value: 'austria', label: 'Austria' },
        { value: 'germany', label: 'Germany' },
        { value: 'france', label: 'France' },
      ],
    },
    {
      value: 'americas',
      label: 'Americas',
      children: [
        { value: 'usa', label: 'United States' },
        { value: 'canada', label: 'Canada' },
        { value: 'brazil', label: 'Brazil' },
      ],
    },
  ];

  protected readonly nodeIdFn = (value: string): string => value;

  protected readonly displayWith = (value: string): string =>
    this.colors.find((c) => c.value === value)?.label ?? value;

  // One distinct signal per cngx probe; no shared mutable state across variants.
  protected readonly singleValue = signal<string | undefined>(undefined);
  protected readonly multiValues = signal<string[]>(['red', 'green']);
  protected readonly typeaheadValue = signal<string | undefined>(undefined);
  protected readonly comboboxValues = signal<string[]>([]);
  protected readonly treeValues = signal<string[]>([]);
  protected readonly reorderableValues = signal<string[]>(['build', 'test', 'deploy']);
  protected readonly actionValue = signal<string | undefined>(undefined);
  protected readonly actionMultiValues = signal<string[]>([]);
  protected readonly shellValue = signal<string | undefined>(undefined);

  // Material counterpart state (plain bindings; no shared identity with cngx probes).
  protected matSingleValue: string | undefined = undefined;
  protected matMultiValues: string[] = ['red', 'green'];
  protected matTypeaheadText = '';
  protected matComboboxValues: string[] = [];

  protected labelOf(value: string): string {
    return this.colors.find((c) => c.value === value)?.label ?? value;
  }
}
