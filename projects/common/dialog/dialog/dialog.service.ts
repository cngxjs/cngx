import { DOCUMENT } from '@angular/common';
import {
  ApplicationRef,
  type ComponentRef,
  createComponent,
  effect,
  EnvironmentInjector,
  inject,
  Injectable,
  Injector,
  type Provider,
  type TemplateRef,
  type Type,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, type Observable, take } from 'rxjs';

import type { CngxDialogConfig } from './dialog-config';
import { CNGX_DIALOG_DATA } from './dialog-config';
import { DIALOG_REF, type DialogRef } from './dialog-ref';
import { CngxDialogOutlet } from './dialog-outlet';

/**
 * Reference to a programmatically opened dialog.
 *
 * Returned by `CngxDialogOpener.open()`. Provides both Signal-based access
 * (`state`, `result`) and Observable convenience methods (`afterClosed()`,
 * `afterOpened()`) for migration compatibility with `MatDialogRef`.
 *
 * ### Signal-based result reading
 * ```typescript
 * const ref = dialog.open<boolean>(ConfirmDialog);
 *
 * // In a computed or effect:
 * const wasCancelled = ref.result() === 'dismissed';
 * ```
 *
 * ### Observable-based result reading
 * ```typescript
 * ref.afterClosed().subscribe(result => {
 *   if (result !== 'dismissed') console.log('Confirmed:', result);
 * });
 * ```
 *
 * @category common/dialog
 */
export class CngxDialogRef<T = unknown> {
  /** @internal */
  readonly _outletRef: ComponentRef<CngxDialogOutlet>;

  /** @internal */
  constructor(
    private readonly inner: DialogRef<T>,
    outletRef: ComponentRef<CngxDialogOutlet>,
    private readonly contentRef: ComponentRef<unknown> | null,
    private readonly injector: Injector,
  ) {
    this._outletRef = outletRef;
  }

  /**
   * Current lifecycle state of the dialog.
   *
   * Possible values: `'closed'`, `'opening'`, `'open'`, `'closing'`.
   */
  get lifecycle() {
    return this.inner.lifecycle;
  }

  /**
   * The typed result signal.
   *
   * - `undefined` before the dialog closes (reset on each open cycle)
   * - `'dismissed'` when dismissed via Escape or backdrop click
   * - `T` when closed with an explicit value
   */
  get result() {
    return this.inner.result;
  }

  /** Unique auto-generated ID for this dialog instance. */
  get id() {
    return this.inner.id;
  }

  /**
   * Close the dialog with a typed result value.
   *
   * @param value - The result to deliver to consumers.
   */
  close(value: T): void {
    this.inner.close(value);
  }

  /**
   * Dismiss the dialog without a typed result.
   *
   * Sets the result to `'dismissed'`. Use for cancellation actions.
   */
  dismiss(): void {
    this.inner.dismiss();
  }

  /**
   * Observable that emits the result when the dialog closes.
   *
   * Emits exactly once with `T | 'dismissed'`, then completes.
   * Compatible with `MatDialogRef.afterClosed()` usage patterns.
   */
  afterClosed(): Observable<T | 'dismissed'> {
    return toObservable(this.inner.lifecycle, { injector: this.injector }).pipe(
      filter((s): s is 'closed' => s === 'closed'),
      take(1),
      map(() => this.inner.result() as T | 'dismissed'),
    );
  }

  /**
   * Observable that emits when the dialog finishes opening.
   *
   * Emits exactly once with `void` when the state transitions to `'open'`,
   * then completes. Useful for post-open logic (e.g., focusing a specific
   * element after animation completes).
   */
  afterOpened(): Observable<void> {
    return toObservable(this.inner.lifecycle, { injector: this.injector }).pipe(
      filter((s): s is 'open' => s === 'open'),
      take(1),
      map(() => undefined),
    );
  }

  /**
   * Reference to the content component instance.
   *
   * Returns `null` when the dialog was opened with a `TemplateRef` instead
   * of a component type.
   */
  get componentRef(): ComponentRef<unknown> | null {
    return this.contentRef;
  }
}

/**
 * Service for opening dialogs programmatically.
 *
 * Works like `MatDialog.open()` — pass a component type and config,
 * get back a typed `CngxDialogRef<T>`.
 *
 * Must be provided via `provideDialog()`.
 *
 * ### Open a component dialog
 * ```typescript
 * const ref = this.dialog.open<User>(EditUserDialog, {
 *   data: { userId: 123 },
 * });
 *
 * ref.afterClosed().subscribe(result => {
 *   if (result !== 'dismissed') saveUser(result);
 * });
 * ```
 *
 * ### Inside the dialog component
 * ```typescript
 * class EditUserDialog {
 *   private readonly data = inject(CNGX_DIALOG_DATA) as { userId: number };
 *   private readonly dialogRef = inject(DIALOG_REF) as DialogRef<User>;
 *
 *   save(user: User) { this.dialogRef.close(user); }
 * }
 * ```
 *
 * @category common/dialog
 */
@Injectable()
export class CngxDialogOpener {
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly injector = inject(Injector);
  private readonly doc = inject(DOCUMENT);

  private readonly openDialogs: CngxDialogRef<unknown>[] = [];

  /**
   * Open a dialog with the given component.
   *
   * @param component — The component type to render inside the dialog.
   * @param config — Optional dialog configuration.
   * @returns A typed `CngxDialogRef<T>` for reading the result and controlling the dialog.
   */
  open<T = unknown, D = unknown>(
    component: Type<unknown>,
    config?: CngxDialogConfig<D>,
  ): CngxDialogRef<T>;

  /**
   * Open a dialog with the given template.
   *
   * @param templateRef — The template to render inside the dialog.
   * @param config — Optional dialog configuration.
   * @returns A typed `CngxDialogRef<T>`.
   */
  open<T = unknown, D = unknown>(
    templateRef: TemplateRef<unknown>,
    config?: CngxDialogConfig<D>,
  ): CngxDialogRef<T>;

  open<T = unknown, D = unknown>(
    content: Type<unknown> | TemplateRef<unknown>,
    config: CngxDialogConfig<D> = {},
  ): CngxDialogRef<T> {
    const outletRef = createComponent(CngxDialogOutlet, {
      environmentInjector: this.envInjector,
    });

    outletRef.setInput('modal', config.modal ?? true);
    outletRef.setInput('closeOnBackdropClick', config.closeOnBackdropClick ?? true);
    outletRef.setInput('closeOnEscape', config.closeOnEscape ?? true);
    if (config.autoFocus) {
      outletRef.setInput('autoFocus', config.autoFocus);
    }

    // Attach to ApplicationRef so change detection runs
    this.appRef.attachView(outletRef.hostView);

    const hostEl = outletRef.location.nativeElement as HTMLElement;
    this.doc.body.appendChild(hostEl);

    const innerDialog = outletRef.instance.dialog() as DialogRef<T>;

    const outletVcr = outletRef.instance.contentOutlet();
    let contentRef: ComponentRef<unknown> | null = null;

    const childInjector = Injector.create({
      parent: this.injector,
      providers: [
        { provide: DIALOG_REF, useValue: innerDialog },
        { provide: CNGX_DIALOG_DATA, useValue: config.data ?? null },
      ],
    });

    if (outletVcr) {
      if (typeof content === 'function') {
        contentRef = outletVcr.createComponent(content, {
          injector: childInjector,
        });
      } else {
        outletVcr.createEmbeddedView(
          content,
          { $implicit: innerDialog },
          { injector: childInjector },
        );
      }
    }

    const dialogRef = new CngxDialogRef<T>(innerDialog, outletRef, contentRef, this.injector);

    this.openDialogs.push(dialogRef as CngxDialogRef<unknown>);

    // CngxDialog has open() but the DialogRef<T> interface does not — call the concrete instance.
    const dialogInstance = outletRef.instance.dialog();
    dialogInstance.open();

    effect(
      () => {
        if (
          innerDialog.lifecycle() === 'closed' &&
          outletRef.hostView &&
          !outletRef.hostView.destroyed
        ) {
          this.cleanup(dialogRef);
        }
      },
      { injector: childInjector },
    );

    return dialogRef;
  }

  /**
   * Dismiss all programmatically opened dialogs.
   *
   * Calls `dismiss()` on each open dialog in reverse order (most recent first).
   * Useful for route guards or global teardown.
   */
  closeAll(): void {
    for (const ref of [...this.openDialogs]) {
      ref.dismiss();
    }
  }

  private cleanup(ref: CngxDialogRef<unknown>): void {
    const idx = this.openDialogs.indexOf(ref);
    if (idx >= 0) {
      this.openDialogs.splice(idx, 1);
    }

    if (ref.componentRef && !ref.componentRef.hostView.destroyed) {
      ref.componentRef.destroy();
    }

    const outletRef = ref._outletRef;
    if (outletRef && !outletRef.hostView.destroyed) {
      this.appRef.detachView(outletRef.hostView);
      (outletRef.location.nativeElement as HTMLElement).remove();
      outletRef.destroy();
    }
  }
}

/**
 * Provide `CngxDialogOpener` for programmatic dialog opening.
 *
 * Must be called in the application's `providers` array or a route's
 * `providers` for `CngxDialogOpener` to be injectable.
 *
 * ```typescript
 * bootstrapApplication(AppComponent, {
 *   providers: [provideDialog()],
 * });
 * ```
 *
 * @category common/dialog
 */
export function provideDialog(): Provider[] {
  return [CngxDialogOpener];
}
