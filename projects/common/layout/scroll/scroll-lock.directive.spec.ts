import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxScrollLock } from './scroll-lock.directive';

@Component({
  template: `<div [cngxScrollLock]="locked()"></div>`,
  imports: [CngxScrollLock],
})
class TestHost {
  locked = signal(false);
}

describe('CngxScrollLock', () => {
  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    return { fixture, host: fixture.componentInstance };
  }

  it('does not lock scroll initially', () => {
    setup();
    expect(document.documentElement.style.overflow).not.toBe('hidden');
  });

  it('sets overflow hidden when enabled', () => {
    const { fixture, host } = setup();
    host.locked.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(document.documentElement.style.overflow).toBe('hidden');
  });

  it('sets scrollbar-gutter stable when enabled', () => {
    const { fixture, host } = setup();
    host.locked.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(document.documentElement.style.scrollbarGutter).toBe('stable');
  });

  it('restores overflow when disabled', () => {
    const { fixture, host } = setup();
    host.locked.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    host.locked.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(document.documentElement.style.overflow).not.toBe('hidden');
  });

  it('restores on destroy', () => {
    const { fixture, host } = setup();
    host.locked.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.destroy();
    expect(document.documentElement.style.overflow).not.toBe('hidden');
  });

  describe('cngxScrollLockTarget', () => {
    @Component({
      template: `
        <section #a class="a" style="overflow: auto"></section>
        <section #b class="b" style="overflow: auto"></section>
        <div [cngxScrollLock]="locked()" [cngxScrollLockTarget]="useB() ? b : a"></div>
        <div [cngxScrollLock]="lockedB()" [cngxScrollLockTarget]="b"></div>
      `,
      imports: [CngxScrollLock],
    })
    class TargetHost {
      locked = signal(false);
      lockedB = signal(false);
      useB = signal(false);
    }

    function setupTarget() {
      const fixture = TestBed.createComponent(TargetHost);
      fixture.detectChanges();
      const el = (sel: string) =>
        (fixture.nativeElement as HTMLElement).querySelector(sel) as HTMLElement;
      const run = (fn: (host: TargetHost) => void) => {
        fn(fixture.componentInstance);
        fixture.detectChanges();
        TestBed.flushEffects();
      };
      return { fixture, a: el('.a'), b: el('.b'), run };
    }

    it('locks the target instead of the document root', () => {
      const { a, run } = setupTarget();
      run((h) => h.locked.set(true));
      expect(a.style.overflow).toBe('hidden');
      expect(document.documentElement.style.overflow).not.toBe('hidden');
    });

    it('moves the lock when the target changes', () => {
      const { a, b, run } = setupTarget();
      run((h) => h.locked.set(true));
      run((h) => h.useB.set(true));
      expect(a.style.overflow).toBe('auto');
      expect(b.style.overflow).toBe('hidden');
    });

    it('keeps a shared target locked until the last instance releases', () => {
      const { b, run } = setupTarget();
      run((h) => {
        h.useB.set(true);
        h.locked.set(true);
        h.lockedB.set(true);
      });
      run((h) => h.locked.set(false));
      expect(b.style.overflow).toBe('hidden');
      run((h) => h.lockedB.set(false));
      expect(b.style.overflow).toBe('auto');
    });

    it('releases the target on destroy', () => {
      const { fixture, a, run } = setupTarget();
      run((h) => h.locked.set(true));
      fixture.destroy();
      expect(a.style.overflow).toBe('auto');
    });
  });
});
