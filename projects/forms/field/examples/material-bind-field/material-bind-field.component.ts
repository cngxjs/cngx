import { ChangeDetectionStrategy, Component, DestroyRef, ViewEncapsulation, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSelectModule } from '@angular/material/select';

import {
  CngxFormField,
  CngxLabel,
  CngxFieldErrors,
  CngxBindField,
  adaptFormControl,
  CNGX_ERROR_MESSAGES,
} from '@cngx/forms/field';

/**
 * The universal bridge on a third-party control. `[cngxBindField]` projects the
 * `cngx-form-field` ARIA/state onto a bare `mat-select` (a self-contained
 * Material widget - no `mat-form-field` needed). `cngxLabel` owns the label/id;
 * `cngx-field-errors` renders validation.
 *
 * Value flow is NOT cngx's job here - it runs on the control's own
 * `[formControl]` binding. Material couples to Reactive Forms (mat-select is a
 * CVA control), so the field is a `FormControl` lifted into a Signal-Forms-shaped
 * accessor via `adaptFormControl`. The readout shows the bridge-derived signals
 * (`id`/`focused`/`empty`/`errorState`) next to the RF control state.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ReactiveFormsModule, MatSelectModule, CngxFormField, CngxLabel, CngxFieldErrors, CngxBindField],
  providers: [{ provide: CNGX_ERROR_MESSAGES, useValue: { required: () => 'Please choose a size' } }],
  styleUrl: './material-bind-field.component.scss',
  template: `
    <div class="demo">
      <p class="lead">
        <code>[cngxBindField]</code> instruments a bare <code>mat-select</code>: Material renders
        the trigger, cngx derives the field state. Value via Reactive Forms.
      </p>

      <div class="block">
        <cngx-form-field [field]="sizeField">
          <label cngxLabel>Size</label>
          <mat-select
            cngxBindField
            #bf="cngxBindField"
            [formControl]="sizeControl"
            placeholder="Choose…"
            class="size-select"
          >
            <mat-option value="s">Small</mat-option>
            <mat-option value="m">Medium</mat-option>
            <mat-option value="l">Large</mat-option>
            <mat-option value="xl">X-Large</mat-option>
          </mat-select>
          <cngx-field-errors />
        </cngx-form-field>

        <dl class="state">
          <dt>id</dt><dd>{{ bf.id() }}</dd>
          <dt>focused</dt><dd>{{ bf.focused() }}</dd>
          <dt>empty</dt><dd>{{ bf.empty() }}</dd>
          <dt>errorState</dt><dd>{{ bf.errorState() }}</dd>
          <dt>value</dt><dd>{{ value() || '—' }}</dd>
          <dt>touched</dt><dd>{{ sizeControl.touched }}</dd>
          <dt>valid</dt><dd>{{ sizeControl.valid }}</dd>
        </dl>
      </div>
    </div>
  `,
})
export class MaterialBindFieldExample {
  private readonly destroyRef = inject(DestroyRef);

  protected readonly sizeControl = new FormControl<string>('', {
    validators: [Validators.required],
    nonNullable: true,
  });

  // Lift the Reactive Forms control into a Signal-Forms-shaped accessor so
  // cngx-form-field can consume it via [field].
  protected readonly sizeField = adaptFormControl(this.sizeControl, 'size', this.destroyRef);

  protected readonly value = toSignal(this.sizeControl.valueChanges, {
    initialValue: this.sizeControl.value,
  });
}
