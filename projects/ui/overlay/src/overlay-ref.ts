import { type OverlayRef as CdkOverlayRef } from '@angular/cdk/overlay';
import { Subject, takeUntil } from 'rxjs';

/** Typed wrapper around a CDK OverlayRef that exposes a close result stream. */
export class CngxOverlayRef<R = unknown> {
  private readonly _afterClosed = new Subject<R | undefined>();

  readonly afterClosed$ = this._afterClosed.asObservable();

  constructor(private readonly cdkRef: CdkOverlayRef) {
    cdkRef
      .backdropClick()
      .pipe(takeUntil(this._afterClosed))
      .subscribe(() => this.close());
  }

  close(result?: R): void {
    this._afterClosed.next(result);
    this._afterClosed.complete();
    this.cdkRef.dispose();
  }
}
