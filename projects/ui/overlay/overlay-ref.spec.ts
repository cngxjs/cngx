import { type OverlayRef as CdkOverlayRef } from '@angular/cdk/overlay';
import { Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { CngxOverlayRef } from './overlay-ref';

interface CdkStub {
  ref: CdkOverlayRef;
  readonly backdrop: Subject<MouseEvent>;
  disposeCalls: number;
}

function makeCdkRef(): CdkStub {
  const backdrop = new Subject<MouseEvent>();
  const stub: CdkStub = {
    backdrop,
    disposeCalls: 0,
    ref: null as unknown as CdkOverlayRef,
  };
  stub.ref = {
    backdropClick: () => backdrop.asObservable(),
    dispose: () => {
      stub.disposeCalls++;
    },
  } as unknown as CdkOverlayRef;
  return stub;
}

describe('CngxOverlayRef', () => {
  it('emits the close result once on afterClosed$ then completes', () => {
    const cdk = makeCdkRef();
    const ref = new CngxOverlayRef<string>(cdk.ref);
    const emissions: (string | undefined)[] = [];
    let completed = false;
    ref.afterClosed$.subscribe({
      next: (r) => emissions.push(r),
      complete: () => {
        completed = true;
      },
    });

    ref.close('done');
    expect(emissions).toEqual(['done']);
    expect(completed).toBe(true);
  });

  it('disposes the CDK ref on close', () => {
    const cdk = makeCdkRef();
    const ref = new CngxOverlayRef(cdk.ref);
    ref.close();
    expect(cdk.disposeCalls).toBe(1);
  });

  it('closes with undefined when no result is passed', () => {
    const cdk = makeCdkRef();
    const ref = new CngxOverlayRef<string>(cdk.ref);
    const emissions: (string | undefined)[] = [];
    ref.afterClosed$.subscribe((r) => emissions.push(r));
    ref.close();
    expect(emissions).toEqual([undefined]);
  });

  it('auto-closes on a backdrop click', () => {
    const cdk = makeCdkRef();
    const ref = new CngxOverlayRef(cdk.ref);
    let closed = false;
    ref.afterClosed$.subscribe({ complete: () => (closed = true) });

    cdk.backdrop.next(new MouseEvent('click'));
    expect(closed).toBe(true);
    expect(cdk.disposeCalls).toBe(1);
  });
});
