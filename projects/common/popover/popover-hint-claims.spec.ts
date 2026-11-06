import { effect, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { createPopoverHintClaims } from './popover-hint-claims';

describe('createPopoverHintClaims', () => {
  it('lets the last live claim win and falls back on release', () => {
    const claims = createPopoverHintClaims<string>();
    const a = {};
    const b = {};

    claims.claim(a, 'x');
    claims.claim(b, 'y');
    expect(claims.current()).toBe('y');

    claims.release(b);
    expect(claims.current()).toBe('x');

    claims.release(a);
    expect(claims.current()).toBeUndefined();
  });

  it('moves a re-claim to the end', () => {
    const claims = createPopoverHintClaims<string>();
    const a = {};
    const b = {};

    claims.claim(a, 'x');
    claims.claim(b, 'y');
    claims.claim(a, 'x');
    expect(claims.current()).toBe('x');

    claims.release(a);
    expect(claims.current()).toBe('y');
  });

  it('ignores a release by an owner that holds no claim', () => {
    const claims = createPopoverHintClaims<string>();
    const a = {};
    claims.claim(a, 'x');

    claims.release({});
    expect(claims.current()).toBe('x');
  });

  it('replaces the owner claim on a new value instead of duplicating it', () => {
    const claims = createPopoverHintClaims<string>();
    const a = {};

    claims.claim(a, 'x');
    claims.claim(a, 'y');
    expect(claims.current()).toBe('y');

    claims.release(a);
    expect(claims.current()).toBeUndefined();
  });

  it('can be claimed from an effect without re-running it', () => {
    const claims = createPopoverHintClaims<string>();
    const owner = {};
    const source = signal('x');
    let runs = 0;

    TestBed.runInInjectionContext(() =>
      effect(() => {
        runs++;
        claims.claim(owner, source());
      }),
    );
    TestBed.flushEffects();
    expect(runs).toBe(1);
    expect(claims.current()).toBe('x');

    TestBed.flushEffects();
    expect(runs).toBe(1);

    source.set('y');
    TestBed.flushEffects();
    expect(runs).toBe(2);
    expect(claims.current()).toBe('y');
  });
});
