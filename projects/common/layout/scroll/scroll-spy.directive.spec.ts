import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxScrollSpy } from './scroll-spy.directive';

let observerCallback: IntersectionObserverCallback;
let observerInstance: { observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> };

class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback;
    observerInstance = { observe: vi.fn(), disconnect: vi.fn() };
    Object.assign(this, observerInstance);
  }
  observe = vi.fn();
  disconnect = vi.fn();
}
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

@Component({
  template: `
    <nav
      [cngxScrollSpy]="sections()"
      #spy="cngxScrollSpy"
      (activeIdChange)="activeId = $event"
    ></nav>
    <section id="intro">Intro</section>
    <section id="features">Features</section>
    <section id="pricing">Pricing</section>
  `,
  imports: [CngxScrollSpy],
})
class TestHost {
  readonly sections = signal(['intro', 'features', 'pricing']);
  activeId: string | null = null;
}

describe('CngxScrollSpy', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const nav = fixture.debugElement.query(By.directive(CngxScrollSpy));
    const dir = nav.injector.get(CngxScrollSpy);
    return { fixture, nav, dir };
  }

  it('starts with no active section', () => {
    const { dir } = setup();
    expect(dir.activeId()).toBeNull();
  });

  it('sets active section based on highest intersection ratio', () => {
    const { dir, fixture } = setup();

    const introSection = document.getElementById('intro')!;
    const featuresSection = document.getElementById('features')!;

    observerCallback(
      [
        { target: introSection, intersectionRatio: 0.2 } as unknown as IntersectionObserverEntry,
        { target: featuresSection, intersectionRatio: 0.5 } as unknown as IntersectionObserverEntry,
      ],
      observerInstance as unknown as IntersectionObserver,
    );

    expect(dir.activeId()).toBe('features');
    expect(fixture.componentInstance.activeId).toBe('features');
  });

  it('ignores sections below threshold', () => {
    const { dir } = setup();

    const introSection = document.getElementById('intro')!;

    observerCallback(
      [{ target: introSection, intersectionRatio: 0.1 } as unknown as IntersectionObserverEntry],
      observerInstance as unknown as IntersectionObserver,
    );

    expect(dir.activeId()).toBeNull();
  });

  it('clears active when all sections are below threshold', () => {
    const { dir } = setup();

    const introSection = document.getElementById('intro')!;

    observerCallback(
      [{ target: introSection, intersectionRatio: 0.5 } as unknown as IntersectionObserverEntry],
      observerInstance as unknown as IntersectionObserver,
    );
    expect(dir.activeId()).toBe('intro');

    observerCallback(
      [{ target: introSection, intersectionRatio: 0.1 } as unknown as IntersectionObserverEntry],
      observerInstance as unknown as IntersectionObserver,
    );
    expect(dir.activeId()).toBeNull();
  });

  it('observes all section elements', () => {
    setup();
    expect(observerInstance.observe).toHaveBeenCalledTimes(3);
  });
});
