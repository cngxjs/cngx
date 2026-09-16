import { type OverlayRef as CdkOverlayRef } from '@angular/cdk/overlay';
import { Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { CngxOverlayRef } from './overlay-ref';

interface CdkStub {
  ref: CdkOverlayRef;
  readonly backdrop: Subject<MouseEvent>;
  readonly keydown: Subject<KeyboardEvent>;
  disposeCalls: number;
}

function makeCdkRef(): CdkStub {
  const backdrop = new Subject<MouseEvent>();
  const keydown = new Subject<KeyboardEvent>();
  const stub: CdkStub = {
    backdrop,
    keydown,
    disposeCalls: 0,
    ref: null as unknown as CdkOverlayRef,
  };
  stub.ref = {
    backdropClick: () => backdrop.asObservable(),
    keydownEvents: () => keydown.asObservable(),
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

  it('exposes the open state as a signal that flips on close', () => {
    const cdk = makeCdkRef();
    const ref = new CngxOverlayRef(cdk.ref);
    expect(ref.isOpen()).toBe(true);
    ref.close();
    expect(ref.isOpen()).toBe(false);
  });

  it('closes on Escape', () => {
    const cdk = makeCdkRef();
    const ref = new CngxOverlayRef(cdk.ref);
    let closed = false;
    ref.afterClosed$.subscribe({ complete: () => (closed = true) });

    cdk.keydown.next(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closed).toBe(true);
    expect(cdk.disposeCalls).toBe(1);
  });

  it('ignores non-Escape keydowns', () => {
    const cdk = makeCdkRef();
    const ref = new CngxOverlayRef(cdk.ref);
    cdk.keydown.next(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(ref.isOpen()).toBe(true);
    expect(cdk.disposeCalls).toBe(0);
  });

  it('does not close on Escape or backdrop when disableClose is set', () => {
    const cdk = makeCdkRef();
    const ref = new CngxOverlayRef(cdk.ref, { disableClose: true });
    cdk.keydown.next(new KeyboardEvent('keydown', { key: 'Escape' }));
    cdk.backdrop.next(new MouseEvent('click'));
    expect(ref.isOpen()).toBe(true);
    expect(cdk.disposeCalls).toBe(0);
    // A programmatic close still works.
    ref.close();
    expect(ref.isOpen()).toBe(false);
  });

  it('restores focus to the opener on close', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const cdk = makeCdkRef();
    const ref = new CngxOverlayRef(cdk.ref, { restoreFocusTo: opener });
    opener.blur();
    ref.close();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('is idempotent - a second close is a no-op', () => {
    const cdk = makeCdkRef();
    const ref = new CngxOverlayRef<string>(cdk.ref);
    const emissions: (string | undefined)[] = [];
    ref.afterClosed$.subscribe((r) => emissions.push(r));
    ref.close('first');
    ref.close('second');
    expect(emissions).toEqual(['first']);
    expect(cdk.disposeCalls).toBe(1);
  });
});
