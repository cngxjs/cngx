import {
  ChangeDetectionStrategy,
  Component,
  input,
  viewChild,
  ViewContainerRef,
} from '@angular/core';

import { CngxDialog } from './dialog.directive';

/**
 * Internal container component for programmatically opened dialogs.
 * Not exported from the public API — used only by `CngxDialogOpener`.
 */
@Component({
  selector: 'cngx-dialog-outlet',
  standalone: true,
  imports: [CngxDialog],
  template: `
    <dialog
      cngxDialog
      [modal]="modal()"
      [closeOnBackdropClick]="closeOnBackdropClick()"
      [closeOnEscape]="closeOnEscape()"
      [autoFocus]="autoFocus()"
      #dialog="cngxDialog"
    >
      <ng-container #contentOutlet />
    </dialog>
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CngxDialogOutlet {
  readonly modal = input(true);
  readonly closeOnBackdropClick = input(true);
  readonly closeOnEscape = input(true);
  readonly autoFocus = input<string>('first-focusable');

  readonly dialog = viewChild.required(CngxDialog);
  readonly contentOutlet = viewChild('contentOutlet', { read: ViewContainerRef });
}
