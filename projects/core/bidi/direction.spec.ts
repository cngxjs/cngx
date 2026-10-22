import { Component, DestroyRef, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CNGX_DIRECTION, injectDirection, provideDirection, provideDirectionAt } from './direction';

const rootDir = () => document.documentElement.getAttribute('dir');

const flushObserver = async () => {
  // MutationObserver callbacks land on the microtask queue, not the Angular
  // effect queue, so TestBed.flushEffects() would never drive them.
  await Promise.resolve();
  await Promise.resolve();
};

@Component({
  selector: 'test-direction-reader',
  template: '',
})
class DirectionReader {
  readonly direction = injectDirection();
}

@Component({
  selector: 'test-direction-host',
  imports: [DirectionReader],
  // viewProviders scopes the override to this component's OWN view: the
  // reader below is a view child, so it resolves the forced 'rtl'. A
  // content-projected reader would fall outside viewProviders and read 'ltr'.
  viewProviders: [provideDirectionAt('rtl')],
  template: '<test-direction-reader />',
})
class DirectionHost {}

@Component({
  selector: 'test-direction-plain-host',
  imports: [DirectionReader],
  template: '<test-direction-reader />',
})
class PlainDirectionHost {}

describe('injectDirection / CNGX_DIRECTION reader', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('dir');
    vi.restoreAllMocks();
  });

  it("resolves 'ltr' when documentElement has no dir", () => {
    const direction = TestBed.runInInjectionContext(() => injectDirection());
    expect(direction()).toBe('ltr');
  });

  it("resolves 'rtl' when documentElement.dir = 'rtl' at construction", () => {
    document.documentElement.dir = 'rtl';
    const direction = TestBed.runInInjectionContext(() => injectDirection());
    expect(direction()).toBe('rtl');
  });

  it('re-signals when the root dir flips to rtl at runtime', async () => {
    const direction = TestBed.runInInjectionContext(() => injectDirection());
    expect(direction()).toBe('ltr');

    document.documentElement.dir = 'rtl';
    await flushObserver();

    expect(direction()).toBe('rtl');
  });

  describe('dir="auto" and invalid values', () => {
    // The browser's auto rule takes the first strong character in tree
    // order, <head> included, so the page <title> is set aside for each case.
    // Specs share one document (isolate: false); every node added is removed.
    let title: HTMLTitleElement | null = null;
    let added: Element[] = [];

    const prependText = (parent: Element, text: string): void => {
      const node = document.createElement('div');
      node.textContent = text;
      parent.prepend(node);
      added.push(node);
    };

    beforeEach(() => {
      title = document.head.querySelector('title');
      title?.remove();
    });

    afterEach(() => {
      added.forEach((node) => node.remove());
      added = [];
      if (title) {
        document.head.prepend(title);
      }
    });

    it("resolves dir=\"auto\" with Hebrew body text to 'rtl'", () => {
      prependText(document.body, 'שלום עולם');
      document.documentElement.dir = 'auto';
      const direction = TestBed.runInInjectionContext(() => injectDirection());
      expect(direction()).toBe('rtl');
    });

    it("resolves dir=\"auto\" with Latin body text to 'ltr'", () => {
      prependText(document.body, 'Hello world');
      document.documentElement.dir = 'auto';
      const direction = TestBed.runInInjectionContext(() => injectDirection());
      expect(direction()).toBe('ltr');
    });

    it("lets a Latin <title> decide dir=\"auto\" ahead of Hebrew body text", () => {
      prependText(document.body, 'שלום עולם');
      prependText(document.head, 'Latin title');
      document.documentElement.dir = 'auto';
      const direction = TestBed.runInInjectionContext(() => injectDirection());
      expect(direction()).toBe('ltr');
    });

    it('re-reads dir="auto" after the first render of a client-rendered app', () => {
      document.documentElement.dir = 'auto';
      const direction = TestBed.runInInjectionContext(() => injectDirection());
      expect(direction()).toBe('ltr');

      prependText(document.body, 'שלום עולם');
      TestBed.tick();

      expect(direction()).toBe('rtl');
    });

    it("resolves dir=\"auto\" to 'ltr' on the server without touching selector APIs", () => {
      const matchesSpy = vi.spyOn(Element.prototype, 'matches');
      prependText(document.body, 'שלום עולם');
      TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
      document.documentElement.dir = 'auto';

      const direction = TestBed.runInInjectionContext(() => injectDirection());

      expect(direction()).toBe('ltr');
      expect(matchesSpy).not.toHaveBeenCalled();
    });

    it("reads dir=\"RTL\" case-insensitively as 'rtl' without a warning", () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      document.documentElement.setAttribute('dir', 'RTL');
      const direction = TestBed.runInInjectionContext(() => injectDirection());
      expect(direction()).toBe('rtl');
      expect(warn).not.toHaveBeenCalled();
    });

    it("reports an invalid dir as 'ltr' and warns CNGX0006 once per distinct value", async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      document.documentElement.setAttribute('dir', 'rlt');
      const direction = TestBed.runInInjectionContext(() => injectDirection());

      expect(direction()).toBe('ltr');
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        expect.stringMatching(/^CNGX0006: injectDirection\(\) ignores <html dir="rlt">/),
      );

      // Same garbage value again: the observer re-reads, the warning stays silent.
      document.documentElement.setAttribute('dir', 'RLT');
      await flushObserver();
      expect(warn).toHaveBeenCalledTimes(1);

      // A valid read resets the dedupe, so the value warns again afterwards.
      document.documentElement.setAttribute('dir', 'rtl');
      await flushObserver();
      expect(direction()).toBe('rtl');
      document.documentElement.setAttribute('dir', 'rlt');
      await flushObserver();
      expect(direction()).toBe('ltr');
      expect(warn).toHaveBeenCalledTimes(2);
    });

    it('names the dir value as authored in CNGX0006', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      document.documentElement.setAttribute('dir', 'RLTX');
      TestBed.runInInjectionContext(() => injectDirection());
      expect(warn).toHaveBeenCalledWith(
        expect.stringMatching(/^CNGX0006: injectDirection\(\) ignores <html dir="RLTX">/),
      );
    });

    it('treats a padded dir value as invalid, like the browser', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      document.documentElement.setAttribute('dir', ' rtl');
      const direction = TestBed.runInInjectionContext(() => injectDirection());
      expect(direction()).toBe('ltr');
      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/^CNGX0006: /));
    });

    it('does not warn when dir is absent', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const direction = TestBed.runInInjectionContext(() => injectDirection());
      expect(direction()).toBe('ltr');
      expect(warn).not.toHaveBeenCalled();
    });
  });

  it("provideDirection('rtl') overrides the reported value without touching documentElement.dir", () => {
    TestBed.configureTestingModule({ providers: [provideDirection('rtl')] });
    const direction = TestBed.runInInjectionContext(() => injectDirection());
    expect(direction()).toBe('rtl');
    expect(rootDir()).toBeNull();
  });

  it('disconnects the observer exactly once on injector destroy', () => {
    const disconnectSpy = vi.spyOn(MutationObserver.prototype, 'disconnect');
    TestBed.runInInjectionContext(() => injectDirection());
    // A resolved reader owns a live observer; destroying the environment
    // injector must run the DestroyRef teardown that disconnects it.
    TestBed.inject(DestroyRef);
    TestBed.resetTestingModule();
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });

  it('installs exactly one observer and reuses the root signal on a second inject', () => {
    // One installed observer => exactly one observe() call. Spying the
    // constructor is unreliable (a newed vitest spy yields a mock instance
    // without observe()), so observe() is the stable single-observer proxy.
    const observeSpy = vi.spyOn(MutationObserver.prototype, 'observe');
    const first = TestBed.runInInjectionContext(() => injectDirection());
    const second = TestBed.runInInjectionContext(() => injectDirection());
    expect(observeSpy).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  it('seeds once and installs no observer on a non-browser platform', async () => {
    const observeSpy = vi.spyOn(MutationObserver.prototype, 'observe');
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });

    const direction = TestBed.runInInjectionContext(() => injectDirection());
    expect(direction()).toBe('ltr');
    expect(observeSpy).not.toHaveBeenCalled();

    // No observer => a runtime root flip must NOT re-signal on the server.
    document.documentElement.dir = 'rtl';
    await flushObserver();
    expect(direction()).toBe('ltr');
  });

  it('injectDirection() returns the same signal as CNGX_DIRECTION', () => {
    const viaFn = TestBed.runInInjectionContext(() => injectDirection());
    const viaToken = TestBed.inject(CNGX_DIRECTION);
    expect(viaFn).toBe(viaToken);
  });

  it("provideDirectionAt('rtl') in viewProviders makes a view child report 'rtl' without touching documentElement.dir", () => {
    const fixture = TestBed.createComponent(DirectionHost);
    fixture.detectChanges();

    const reader = fixture.debugElement.query(By.directive(DirectionReader))
      .componentInstance as DirectionReader;
    expect(reader.direction()).toBe('rtl');
    expect(rootDir()).toBeNull();
  });

  it("a sibling host without provideDirectionAt reads the document default 'ltr'", () => {
    const fixture = TestBed.createComponent(PlainDirectionHost);
    fixture.detectChanges();

    const reader = fixture.debugElement.query(By.directive(DirectionReader))
      .componentInstance as DirectionReader;
    expect(reader.direction()).toBe('ltr');
  });
});
