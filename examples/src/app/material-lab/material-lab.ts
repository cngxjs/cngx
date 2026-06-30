import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, schema, required, email, disabled, FormField } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';

import { CngxSlider, CngxRangeSlider } from '@cngx/common/interactive';
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
import {
  CngxFormField,
  CngxLabel,
  CngxHint,
  CngxFieldErrors,
  CngxFormErrors,
} from '@cngx/forms/field';
import {
  CngxInput,
  CngxPasswordToggle,
  CngxCharCount,
  CngxInputClear,
  CngxAutosize,
} from '@cngx/forms/input';
import type { CngxTreeNode } from '@cngx/utils';

interface FieldModel {
  name: string;
  password: string;
  bio: string;
  about: string;
  clearable: string;
  reqName: string;
  errEmail: string;
  locked: string;
}

/**
 * Local Material-bridge fidelity harness (not generated, not shipped). Renders
 * every cngx select-family variant, the cngx-form-field + cngxInput family, and
 * the form-field state matrix (required / error / disabled / form-error summary)
 * with the working-tree Material bridge, side by side with a real Angular
 * Material counterpart wherever a clean equivalent exists, under the same M3
 * azure theme. This is the only working-tree-faithful preview of the bridge: the
 * SCSS `@use`s the bridges via relative source paths, whereas the compodocx
 * StackBlitz playgrounds pin published rc.3.
 *
 * Scope note: only `cngxInput` provides `CNGX_FORM_FIELD_CONTROL`, so the
 * field bridge (`field-theme.scss`, scoped to `:where(cngx-form-field)`) themes
 * the cngxInput family shown here. The standalone formatting behaviours
 * (numeric / mask / otp / format / copy-value / file-drop) live in their own
 * story routes and are outside that scope.
 *
 * Route: `/#/material-lab`.
 */
@Component({
  selector: 'app-material-lab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    FormsModule,
    FormField,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatSliderModule,
    CngxSlider,
    CngxRangeSlider,
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
    CngxFormField,
    CngxLabel,
    CngxHint,
    CngxFieldErrors,
    CngxFormErrors,
    CngxInput,
    CngxPasswordToggle,
    CngxCharCount,
    CngxInputClear,
    CngxAutosize,
  ],
  styleUrl: './material-lab.scss',
  template: `
    <div class="lab mat-app-background mat-typography">
      <section>
        <h3>single-select (minimal)</h3>
        <cngx-select
          class="probe-cngx"
          [label]="'Color'"
          [options]="colors"
          [(value)]="simpleValue"
        />

        <mat-form-field appearance="outline">
          <mat-label>Color</mat-label>
          <mat-select [(ngModel)]="matSimpleValue" class="probe-mat">
            @for (c of colors; track c.value) {
              <mat-option [value]="c.value">{{ c.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </section>

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
        <h3>slider (single)</h3>
        <cngx-slider
          class="probe-cngx"
          aria-label="Volume"
          [(value)]="sliderValue"
          [min]="0"
          [max]="100"
          [step]="5"
        />

        <mat-slider min="0" max="100" step="5" class="probe-mat">
          <input matSliderThumb [(ngModel)]="matSliderValue" aria-label="Volume" />
        </mat-slider>
      </section>

      <section>
        <h3>slider (range)</h3>
        <cngx-range-slider
          class="probe-cngx"
          aria-label="Price range"
          [(value)]="rangeValue"
          [min]="0"
          [max]="1000"
          [step]="10"
        />

        <mat-slider min="0" max="1000" step="10" class="probe-mat">
          <input matSliderStartThumb [(ngModel)]="matRangeStart" aria-label="Minimum" />
          <input matSliderEndThumb [(ngModel)]="matRangeEnd" aria-label="Maximum" />
        </mat-slider>
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

      <section>
        <h3>input: text + hint</h3>
        <cngx-form-field [field]="fieldForm.name">
          <label cngxLabel>Full name</label>
          <input
            cngxInput
            class="probe-cngx"
            [formField]="fieldForm.name"
            placeholder="Ada Lovelace"
          />
          <span cngxHint>As it appears on your ID</span>
        </cngx-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Full name</mat-label>
          <input matInput class="probe-mat" [(ngModel)]="matName" placeholder="Ada Lovelace" />
          <mat-hint>As it appears on your ID</mat-hint>
        </mat-form-field>
      </section>

      <section>
        <h3>input: password (toggle)</h3>
        <cngx-form-field [field]="fieldForm.password">
          <label cngxLabel>Password</label>
          <input
            cngxInput
            cngxPasswordToggle
            #pwd="cngxPasswordToggle"
            class="probe-cngx"
            [formField]="fieldForm.password"
            placeholder="At least 8 characters"
          />
          <button
            type="button"
            class="lab-inline-btn"
            (click)="pwd.toggle()"
            [attr.aria-label]="pwd.visible() ? 'Hide password' : 'Show password'"
          >
            {{ pwd.visible() ? 'Hide' : 'Show' }}
          </button>
          <span cngxHint>8-64 characters</span>
        </cngx-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Password</mat-label>
          <input
            matInput
            class="probe-mat"
            type="password"
            [(ngModel)]="matPassword"
            placeholder="At least 8 characters"
          />
          <mat-hint>8-64 characters</mat-hint>
        </mat-form-field>
      </section>

      <section>
        <h3>input: textarea + char-count</h3>
        <cngx-form-field [field]="fieldForm.bio">
          <label cngxLabel>Bio</label>
          <textarea
            cngxInput
            class="probe-cngx"
            [formField]="fieldForm.bio"
            rows="3"
            placeholder="Tell us about yourself..."
            style="resize:vertical;width:100%"
          ></textarea>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span cngxHint>10-140 characters</span>
            <cngx-char-count [max]="140" />
          </div>
        </cngx-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Bio</mat-label>
          <textarea
            matInput
            class="probe-mat"
            #matBioRef
            [(ngModel)]="matBio"
            rows="3"
            maxlength="140"
            placeholder="Tell us about yourself..."
          ></textarea>
          <mat-hint align="start">10-140 characters</mat-hint>
          <mat-hint align="end">{{ matBioRef.value.length }} / 140</mat-hint>
        </mat-form-field>
      </section>

      <section>
        <h3>input: autosize textarea</h3>
        <cngx-form-field [field]="fieldForm.about">
          <label cngxLabel>About</label>
          <textarea
            cngxInput
            cngxAutosize
            class="probe-cngx"
            [formField]="fieldForm.about"
            placeholder="Grows as you type..."
            style="width:100%"
          ></textarea>
          <span cngxHint>Grows with content</span>
        </cngx-form-field>
      </section>

      <section>
        <h3>input: clearable</h3>
        <cngx-form-field [field]="fieldForm.clearable">
          <label cngxLabel>Search</label>
          <input
            cngxInput
            #clearInput
            class="probe-cngx"
            [formField]="fieldForm.clearable"
            placeholder="Type, then clear"
          />
          <button
            type="button"
            class="lab-inline-btn"
            [cngxInputClear]="clearInput"
            #clr="cngxInputClear"
            [style.opacity]="clr.hasValue() ? 1 : 0.35"
          >
            Clear
          </button>
        </cngx-form-field>
      </section>

      <section>
        <h3>state: required</h3>
        <cngx-form-field [field]="fieldForm.reqName">
          <label cngxLabel>Display name</label>
          <input cngxInput class="probe-cngx" [formField]="fieldForm.reqName" />
          <cngx-field-errors />
        </cngx-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Display name</mat-label>
          <input matInput class="probe-mat" required [(ngModel)]="matReqName" />
        </mat-form-field>
      </section>

      <section>
        <h3>state: error (invalid)</h3>
        <cngx-form-field [field]="fieldForm.errEmail">
          <label cngxLabel>Email</label>
          <input cngxInput class="probe-cngx" [formField]="fieldForm.errEmail" />
          <cngx-field-errors />
        </cngx-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input
            matInput
            class="probe-mat"
            #matEmailRef="ngModel"
            required
            email
            [(ngModel)]="matErrEmail"
          />
          @if (matEmailRef.invalid) {
            <mat-error>Enter a valid email address</mat-error>
          }
        </mat-form-field>
      </section>

      <section>
        <h3>state: disabled</h3>
        <cngx-form-field [field]="fieldForm.locked">
          <label cngxLabel>Account ID</label>
          <input cngxInput class="probe-cngx" [formField]="fieldForm.locked" />
          <span cngxHint>Assigned at signup</span>
        </cngx-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Account ID</mat-label>
          <input matInput class="probe-mat" disabled [(ngModel)]="matLocked" />
          <mat-hint>Assigned at signup</mat-hint>
        </mat-form-field>
      </section>

      <section>
        <h3>state: form-error summary (cngx only)</h3>
        <cngx-form-errors
          class="probe-cngx"
          [fields]="[fieldForm.reqName, fieldForm.errEmail]"
          [show]="showSummary()"
        />
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
  protected readonly simpleValue = signal<string | undefined>(undefined);
  protected readonly singleValue = signal<string | undefined>(undefined);
  protected readonly sliderValue = signal<number>(40);
  protected readonly rangeValue = signal<[number, number]>([200, 800]);
  protected readonly multiValues = signal<string[]>(['red', 'green']);
  protected readonly typeaheadValue = signal<string | undefined>(undefined);
  protected readonly comboboxValues = signal<string[]>([]);
  protected readonly treeValues = signal<string[]>([]);
  protected readonly reorderableValues = signal<string[]>(['build', 'test', 'deploy']);
  protected readonly actionValue = signal<string | undefined>(undefined);
  protected readonly actionMultiValues = signal<string[]>([]);
  protected readonly shellValue = signal<string | undefined>(undefined);

  // Signal Forms model backing the cngx-form-field probes. `errEmail` carries an
  // invalid value and `locked` is schema-disabled so the error and disabled
  // states render on load without interaction.
  protected readonly fieldModel = signal<FieldModel>({
    name: '',
    password: '',
    bio: '',
    about: '',
    clearable: '',
    reqName: '',
    errEmail: 'not-an-email',
    locked: 'ACC-100425',
  });

  protected readonly fieldForm = form(
    this.fieldModel,
    schema<FieldModel>((root) => {
      required(root.reqName);
      required(root.errEmail);
      email(root.errEmail);
      disabled(root.locked);
    }),
  );

  protected readonly showSummary = signal(true);

  // Material counterpart state (plain bindings; no shared identity with cngx probes).
  protected matSimpleValue: string | undefined = undefined;
  protected matSingleValue: string | undefined = undefined;
  protected matSliderValue = 40;
  protected matRangeStart = 200;
  protected matRangeEnd = 800;
  protected matMultiValues: string[] = ['red', 'green'];
  protected matTypeaheadText = '';
  protected matComboboxValues: string[] = [];
  protected matName = '';
  protected matPassword = '';
  protected matBio = '';
  protected matReqName = '';
  protected matErrEmail = 'not-an-email';
  protected matLocked = 'ACC-100425';

  constructor() {
    // Pre-touch the required/invalid fields so their error styling is visible on
    // load — this is a fidelity harness, not an interaction demo.
    this.fieldForm.reqName().markAsTouched();
    this.fieldForm.errEmail().markAsTouched();
  }

  protected labelOf(value: string): string {
    return this.colors.find((c) => c.value === value)?.label ?? value;
  }
}
