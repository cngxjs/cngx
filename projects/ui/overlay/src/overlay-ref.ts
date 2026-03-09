import { OverlayRef as CdkOverlayRef } from '@angular/cdk/overlay';
import { Subject } from 'rxjs';

/** Typed wrapper around a CDK OverlayRef that exposes a close result stream. */
export class NgxOverlayRef<R = unknown> {
  private readonly _afterClosed = new Subject<R | undefined>();

  readonly afterClosed$ = this._afterClosed.asObservable();

  constructor(private readonly cdkRef: CdkOverlayRef) {
    cdkRef.backdropClick().subscribe(() => this.close());
  }

  close(result?: R): void {
    this._afterClosed.next(result);
    this._afterClosed.complete();
    this.cdkRef.dispose();
  }
}
