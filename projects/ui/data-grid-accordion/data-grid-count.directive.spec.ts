import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxDataGridAccordion } from './data-grid-accordion.component';
import { CngxDataGridFooter } from './data-grid-footer.component';
import type { CngxDataGridAccordionLabels } from './config/data-grid-accordion.config';
import { withDataGridAccordionLabels } from './config/features';
import { provideDataGridAccordionConfig } from './config/provide-data-grid-accordion-config';
import { CngxDgaCount } from './data-grid-count.directive';

@Component({
  template: `<span [cngxDgaCount]="count()"></span>`,
  imports: [CngxDgaCount],
})
class Host {
  readonly count = signal(0);
}

@Component({
  template: `<cngx-data-grid-accordion>
    <cngx-dga-footer>
      <span [cngxDgaCount]="count()"></span>
    </cngx-dga-footer>
  </cngx-data-grid-accordion>`,
  imports: [CngxDataGridAccordion, CngxDataGridFooter, CngxDgaCount],
})
class FooterHost {
  readonly count = signal(3);
}

describe('CngxDgaCount', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const de = fixture.debugElement.query(By.directive(CngxDgaCount));
    return { fixture, host: fixture.componentInstance, el: de.nativeElement as HTMLElement };
  }

  it('is a polite, atomic status live region', () => {
    const { el } = setup();
    expect(el.getAttribute('role')).toBe('status');
    expect(el.getAttribute('aria-live')).toBe('polite');
    expect(el.getAttribute('aria-atomic')).toBe('true');
  });

  it('renders the count with a pluralised noun and updates reactively', () => {
    const { fixture, host, el } = setup();
    expect(el.textContent).toBe('0 results');

    host.count.set(1);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(el.textContent).toBe('1 result');

    host.count.set(7);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(el.textContent).toBe('7 results');
  });
  describe('labels bundle', () => {
    @Component({
      template: `<span
        [cngxDgaCount]="count()"
        cngxDgaCountSingular="row"
        cngxDgaCountPlural="rows"
      ></span>`,
      imports: [CngxDgaCount],
    })
    class NounHost {
      readonly count = signal(2);
    }

    const labelsOverride = signal<Partial<CngxDataGridAccordionLabels>>({});

    beforeEach(() => {
      labelsOverride.set({});
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideDataGridAccordionConfig(withDataGridAccordionLabels(labelsOverride))],
      });
    });

    it('writes the translated count when no noun is bound', () => {
      labelsOverride.set({ count: (n) => `${n} Treffer` });
      const { el } = setup();
      expect(el.textContent).toBe('0 Treffer');
    });

    it('composes the count from noun-only label overrides', () => {
      labelsOverride.set({ countSingular: 'Treffer', countPlural: 'Treffer' });
      const { fixture, host, el } = setup();
      host.count.set(3);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(el.textContent).toBe('3 Treffer');
    });

    it('lets a count formatter win over noun labels', () => {
      labelsOverride.set({ countPlural: 'Zeilen', count: (n) => `${n} Treffer` });
      const { el } = setup();
      expect(el.textContent).toBe('0 Treffer');
    });

    it('keeps the legacy <count> <noun> composition for bound nouns', () => {
      labelsOverride.set({ count: (n) => `${n} Treffer` });
      const fixture = TestBed.createComponent(NounHost);
      fixture.detectChanges();
      const el = fixture.debugElement.query(By.directive(CngxDgaCount))
        .nativeElement as HTMLElement;
      expect(el.textContent).toBe('2 rows');
    });

    it('does not rewrite a shown count on a copy flip; the next count speaks the new copy', () => {
      const { fixture, host, el } = setup();
      host.count.set(3);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(el.textContent).toBe('3 results');

      labelsOverride.set({ count: (n) => `${n} Treffer` });
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(el.textContent).toBe('3 results');

      host.count.set(4);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(el.textContent).toBe('4 Treffer');
    });
  });
});

/**
 * The documented footer markup is a bare `<span cngxDgaCount>` - the natural shape
 * for a live-count element. It must land in the first content column, not the 2rem
 * chevron gutter, without the consumer remembering `cngxDgaCell`. jsdom cannot
 * resolve the injected cascade, so the placement is asserted off the compiled rule
 * (comments stripped) plus the rendered DOM structure.
 */
describe('CngxDgaCount - bare footer placement', () => {
  function gridCss(): string {
    return Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .filter((t) => t.includes('cngx-dga-footer'))
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, '');
  }

  it('places a bare (no cngxDgaCell) footer count in the first content column', () => {
    TestBed.configureTestingModule({ imports: [FooterHost] });
    const fixture = TestBed.createComponent(FooterHost);
    fixture.detectChanges();

    const count = fixture.debugElement.query(By.directive(CngxDgaCount))
      .nativeElement as HTMLElement;
    const footer = count.parentElement as HTMLElement;
    // A bare first child - no cngxDgaCell - yet valid, documented footer markup
    // (projected straight into the footer host via `<ng-content />`).
    expect(footer.classList.contains('cngx-dga-footer')).toBe(true);
    expect(footer.firstElementChild).toBe(count);
    expect(count.classList.contains('cngx-dga-cell')).toBe(false);

    // The widened selector gives ANY first footer child the content column (track
    // 2); before the fix only `.cngx-dga-cell:first-child` escaped the gutter.
    const css = gridCss();
    expect(css).toMatch(
      /\.cngx-dga-footer\s*>\s*:first-child[^{}]*\{[^}]*grid-column-start:\s*2/,
    );
  });
});
