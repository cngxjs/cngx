import { FormControl, FormGroup, Validators } from '@angular/forms';

/**
 * Shared sample `FormGroup` used by the form-primitives demo to exercise
 * the `CngxFormBridge` against every value-bearing atom in one go. The
 * shape mirrors the bridge's value-shape taxonomy:
 *
 * - `notifications: boolean` — boolean atom (`<cngx-toggle>`).
 * - `terms: boolean` (requiredTrue) — boolean atom (`<cngx-checkbox>`).
 * - `featured: boolean` — boolean atom (`<cngx-chip cngxChipInteraction>`).
 * - `payment: string|null` — single-value group (`<cngx-radio-group>`).
 * - `view: string|null` — single-value group (`<cngx-button-toggle-group>`).
 * - `size: string|null` — single-value group (`<cngx-chip-group>`).
 * - `notificationChannels: string[]` — multi-value group (`<cngx-checkbox-group>`).
 * - `filters: string[]` — multi-value group (`<cngx-button-multi-toggle-group>`).
 * - `tags: string[]` — multi-value group (`<cngx-multi-chip-group>`).
 *
 * Internal demo fixture only — never published. Used exclusively by
 * `form-primitives-demo`.
 */
export interface FormPrimitivesFormShape {
  readonly notifications: FormControl<boolean>;
  readonly terms: FormControl<boolean>;
  readonly featured: FormControl<boolean>;
  readonly payment: FormControl<string | null>;
  readonly view: FormControl<string | null>;
  readonly size: FormControl<string | null>;
  readonly notificationChannels: FormControl<string[]>;
  readonly filters: FormControl<string[]>;
  readonly tags: FormControl<string[]>;
}

export function createFormPrimitivesFormGroup(): FormGroup<FormPrimitivesFormShape> {
  return new FormGroup<FormPrimitivesFormShape>({
    notifications: new FormControl<boolean>(false, { nonNullable: true }),
    terms: new FormControl<boolean>(false, {
      nonNullable: true,
      validators: [Validators.requiredTrue],
    }),
    featured: new FormControl<boolean>(false, { nonNullable: true }),
    payment: new FormControl<string | null>(null, [Validators.required]),
    view: new FormControl<string | null>(null, [Validators.required]),
    size: new FormControl<string | null>(null, [Validators.required]),
    notificationChannels: new FormControl<string[]>([], {
      nonNullable: true,
      validators: [(c) => (c.value.length > 0 ? null : { required: true })],
    }),
    filters: new FormControl<string[]>([], { nonNullable: true }),
    tags: new FormControl<string[]>(['ng'], { nonNullable: true }),
  });
}
