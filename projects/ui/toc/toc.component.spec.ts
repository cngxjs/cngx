import {
  Component,
  Directive,
  inject,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CNGX_TOC_CONFIG, CNGX_TOC_DEFAULTS } from './config/toc.config.defaults';
import { CngxToc } from './toc.component';
import { CngxTocItemSlot } from './toc-item-slot';
import { CNGX_TOC } from './toc-token';
import type { CngxTocItem, CngxTocItemContext } from './toc.types';

// --- Fake IntersectionObserver (locked stub) -------------------------------
// The aria-current invariant is this file's headline assertion and CngxScrollSpy
// builds a real IntersectionObserver, so the spec must drive it. IO is a bare
// global, so vi.stubGlobal is the only form that reaches it - paired with a
// mandatory vi.unstubAllGlobals() in afterEach (restoreAllMocks does not undo
// it and a leaked stub corrupts later specs in the same worker).
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

// Config-default item template, injected via a token override that reads this
// signal. Set only by the config-default test; reset before every test so it
// never bleeds into a run that expects the built-in label.
const cfgItemTpl = signal<TemplateRef<CngxTocItemContext> | undefined>(undefined);

const TOC: readonly CngxTocItem[] = [
  { id: 'intro', label: 'Intro' },
  {
    id: 'features',
    label: 'Features',
    children: [
      { id: 'features-a', label: 'Feature A' },
      { id: 'features-b', label: 'Feature B' },
    ],
  },
  { id: 'pricing', label: 'Pricing' },
];

// Same ids and labels, all fresh references - the same-shape re-set that must
// leave flatIds / activeTrail reference-stable.
const TOC_CLONE: readonly CngxTocItem[] = [
  { id: 'intro', label: 'Intro' },
  {
    id: 'features',
    label: 'Features',
    children: [
      { id: 'features-a', label: 'Feature A' },
      { id: 'features-b', label: 'Feature B' },
    ],
  },
  { id: 'pricing', label: 'Pricing' },
];

const SECTIONS = `
  <section id="intro">Intro</section>
  <section id="features">Features</section>
  <section id="features-a">Feature A</section>
  <section id="features-b">Feature B</section>
  <section id="pricing">Pricing</section>
`;

@Component({
  imports: [CngxToc],
  template: `<cngx-toc [items]="items()" />${SECTIONS}`,
})
class TocHost {
  readonly items = signal<readonly CngxTocItem[]>(TOC);
}

@Component({
  imports: [CngxToc, CngxTocItemSlot],
  template: `
    <cngx-toc [items]="items">
      <ng-template cngxTocItem let-item let-active="active">
        <span class="slotted" [attr.data-active]="active">SLOT:{{ item.label }}</span>
      </ng-template>
    </cngx-toc>
    ${SECTIONS}
  `,
})
class SlotHost {
  readonly items = TOC;
}

@Component({
  template: `<ng-template #tpl let-item>CFG:{{ item.label }}</ng-template>`,
})
class TplHolder {
  readonly tpl = viewChild.required<TemplateRef<CngxTocItemContext>>('tpl');
}

@Directive({ selector: '[tocProbe]' })
class TocProbe {
  readonly contract = inject(CNGX_TOC, { host: true });
}

@Component({
  imports: [CngxToc, TocProbe],
  template: `<cngx-toc tocProbe [items]="items" />${SECTIONS}`,
})
class ProbeHost {
  readonly items = TOC;
  readonly probe = viewChild.required(TocProbe);
}

function getToc(fixture: { debugElement: import('@angular/core').DebugElement }): CngxToc {
  return fixture.debugElement.query(By.directive(CngxToc)).componentInstance;
}

describe('CngxToc', () => {
  beforeEach(() => {
    cfgItemTpl.set(undefined);
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    TestBed.configureTestingModule({
      providers: [
        {
          // Token override so the config-default template can be injected from a
          // signal the config-default test sets before the toc is constructed.
          provide: CNGX_TOC_CONFIG,
          useFactory: () => ({ ...CNGX_TOC_DEFAULTS, templates: { item: cfgItemTpl() } }),
        },
      ],
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  function setup() {
    const fixture = TestBed.createComponent(TocHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    return { fixture, toc: getToc(fixture) };
  }

  it('derives a depth-first flat id list from nested items', () => {
    const { toc } = setup();
    expect(toc['flatIds']()).toEqual(['intro', 'features', 'features-a', 'features-b', 'pricing']);
  });

  it('keeps flatIds reference-stable across a same-shape re-set (equal guard)', () => {
    const { fixture, toc } = setup();
    const first = toc['flatIds']();

    fixture.componentInstance.items.set(TOC_CLONE);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(toc['flatIds']()).toBe(first);
  });

  it('keeps activeTrail reference-stable across a same-shape re-set (equal guard)', () => {
    const { fixture, toc } = setup();

    activate('features-a', 0.6);
    fixture.detectChanges();
    const first = toc['activeTrail']();
    expect(first).toEqual(['features']);

    fixture.componentInstance.items.set(TOC_CLONE);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(toc['activeTrail']()).toBe(first);
  });

  it('reads activeId() as null on the first pass with no ExpressionChanged error', () => {
    const fixture = TestBed.createComponent(TocHost);
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(getToc(fixture).activeId()).toBeNull();
  });

  it('renders exactly one aria-current, moving it as the active section changes', () => {
    const { fixture } = setup();

    activate('intro', 0.5);
    fixture.detectChanges();
    let current = fixture.nativeElement.querySelectorAll('.cngx-toc__link[aria-current]');
    expect(current.length).toBe(1);
    expect(current[0].textContent).toContain('Intro');

    activate('features', 0.7);
    fixture.detectChanges();
    current = fixture.nativeElement.querySelectorAll('.cngx-toc__link[aria-current]');
    expect(current.length).toBe(1);
    expect(current[0].textContent).toContain('Features');
  });

  it('marks the ancestor chain of the active leaf with data-active-trail', () => {
    const { fixture } = setup();

    activate('features-a', 0.6);
    fixture.detectChanges();

    const trail = fixture.nativeElement.querySelectorAll('.cngx-toc__item[data-active-trail]');
    expect(trail.length).toBe(1);
    expect(trail[0].querySelector('.cngx-toc__link').textContent).toContain('Features');
  });

  it('renders a projected *cngxTocItem slot', () => {
    const fixture = TestBed.createComponent(SlotHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    const slotted = fixture.nativeElement.querySelectorAll('.slotted');
    expect(slotted.length).toBe(5);
    expect(slotted[0].textContent).toContain('SLOT:Intro');
  });

  it('renders the config-default item template when no instance slot is projected', () => {
    const holder = TestBed.createComponent(TplHolder);
    holder.detectChanges();
    cfgItemTpl.set(holder.componentInstance.tpl());

    const { fixture } = setup();
    const nav = fixture.nativeElement.querySelector('.cngx-toc__nav');
    expect(nav.textContent).toContain('CFG:Intro');
  });

  it('provides CNGX_TOC, resolvable from a host-scoped injector', () => {
    const fixture = TestBed.createComponent(ProbeHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    const contract = fixture.componentInstance.probe().contract;
    expect(contract.activeId()).toBeNull();
    expect(typeof contract.scrollTo).toBe('function');
  });

  // Drive the captured IO callback to make one section the most-visible.
  function activate(id: string, ratio: number): void {
    const target = document.getElementById(id)!;
    observerCallback(
      [{ target, intersectionRatio: ratio } as unknown as IntersectionObserverEntry],
      observerInstance as unknown as IntersectionObserver,
    );
  }
});
