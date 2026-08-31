import {
  ChangeDetectionStrategy,
  Component,
  input,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';
import type { Observable } from 'rxjs';

import { CngxDialog } from './dialog.directive';

/**
 * Internal container component for programmatically opened dialogs.
 *
 * Not part of the public API - instantiated exclusively by `CngxDialogOpener`.
 * Renders the native `<dialog>` shell and exposes a `<ng-container>` outlet
 * where the content component or template is inserted.
 *
 * @internal
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
      [submitAction]="submitAction()"
      [state]="state()"
      [error]="error()"
      [focusFallback]="focusFallback()"
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
  readonly submitAction = input<
    ((value: unknown) => Promise<unknown> | Observable<unknown>) | undefined
  >(undefined);
  readonly state = input<CngxAsyncState<unknown> | undefined>(undefined);
  readonly error = input(false);
  readonly focusFallback = input<HTMLElement | undefined>(undefined);

  readonly dialog = viewChild.required(CngxDialog);
  readonly contentOutlet = viewChild('contentOutlet', { read: ViewContainerRef });
}
