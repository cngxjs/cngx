import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  CNGX_DIALOG_DATA,
  CngxDialogClose,
  CngxDialogDescription,
  CngxDialogTitle,
  DIALOG_REF,
  type DialogRef,
} from '@cngx/common/dialog';

/**
 * Payload the `cngxdialogopener-programmatic` story passes through
 * `CngxDialogOpener.open(component, { data })`. Kept small on purpose -
 * the demo's point is the round-trip, not the content shape.
 */
export interface ProgrammaticDialogData {
  readonly heading: string;
  readonly body: string;
}

/**
 * Demo fixture rendered by the `cngxdialogopener-programmatic` story.
 * Pulls its content from `CNGX_DIALOG_DATA` and resolves the typed
 * dialog result through `cngxDialogClose` plus the injected `DIALOG_REF`.
 *
 * Internal demo fixture only - not part of any published bundle.
 */
@Component({
  selector: 'demo-programmatic-dialog-content',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxDialogTitle, CngxDialogDescription, CngxDialogClose],
  template: `
    <h2 cngxDialogTitle>{{ data.heading }}</h2>
    <p cngxDialogDescription>{{ data.body }}</p>
    <div class="button-row" style="margin-top:16px;justify-content:flex-end">
      <button class="chip" [cngxDialogClose]="'cancel'">Cancel</button>
      <button class="chip chip--active" [cngxDialogClose]="'confirm'">
        Confirm
      </button>
    </div>
  `,
})
export class ProgrammaticDialogContent {
  protected readonly data = inject<ProgrammaticDialogData>(CNGX_DIALOG_DATA);

  /** Exposed so the story can illustrate inject(DIALOG_REF) in TypeScript. */
  protected readonly dialogRef = inject<DialogRef<'cancel' | 'confirm'>>(
    DIALOG_REF,
  );
}
