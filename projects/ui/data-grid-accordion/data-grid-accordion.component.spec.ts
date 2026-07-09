import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxAccordion } from '@cngx/common/interactive';

import { CngxDataGridAccordion } from './data-grid-accordion.component';
import { CNGX_DATA_GRID_ACCORDION } from './data-grid-accordion.token';
import type { CngxDataGridSkin } from './config/data-grid-accordion.config';
import { withDataGridSkin } from './config/features';
import { provideDataGridAccordionConfig } from './config/provide-data-grid-accordion-config';

@Component({
  template: `<cngx-data-grid-accordion
    [multi]="multi()"
    [headingLevel]="level()"
    [skin]="skin()"
    [columns]="columns()"
    [(openIds)]="open"
  ></cngx-data-grid-accordion>`,
  imports: [CngxDataGridAccordion],
})
class Host {
  readonly multi = signal(false);
  readonly level = signal<number | string>(3);
  readonly skin = signal<CngxDataGridSkin | undefined>(undefined);
  readonly columns = signal('8ch 1fr auto');
  readonly open = signal<ReadonlySet<string>>(new Set());
}

describe('CngxDataGridAccordion', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const de = fixture.debugElement.query(By.directive(CngxDataGridAccordion));
    return {
      fixture,
      host: fixture.componentInstance,
      group: de.injector.get(CngxDataGridAccordion),
      accordion: de.injector.get(CngxAccordion),
      el: de.nativeElement as HTMLElement,
    };
  }

  it('provides CNGX_DATA_GRID_ACCORDION resolving to the group', () => {
    const { fixture } = setup();
    const de = fixture.debugElement.query(By.directive(CngxDataGridAccordion));
    expect(de.injector.get(CNGX_DATA_GRID_ACCORDION)).toBe(de.injector.get(CngxDataGridAccordion));
  });

  it('defaults heading level to 3 and clamps into the ARIA 2-6 range', () => {
    const { fixture, host, group } = setup();
    expect(group.headingLevel()).toBe(3);

    host.level.set(1);
    fixture.detectChanges();
    expect(group.headingLevel()).toBe(2);

    host.level.set(9);
    fixture.detectChanges();
    expect(group.headingLevel()).toBe(6);
  });

  it('coerces a string heading level from attribute binding', () => {
    const { fixture, host, group } = setup();
    host.level.set('5');
    fixture.detectChanges();
    expect(group.headingLevel()).toBe(5);
  });

  it('reflects [columns] onto the --cngx-dga-columns host property', () => {
    const { fixture, host, el } = setup();
    expect(el.style.getPropertyValue('--cngx-dga-columns')).toBe('8ch 1fr auto');

    host.columns.set('12ch 1fr');
    fixture.detectChanges();
    expect(el.style.getPropertyValue('--cngx-dga-columns')).toBe('12ch 1fr');
  });

  it('forwards [multi] to the hosted CngxAccordion brain', () => {
    const { fixture, host, accordion } = setup();
    expect(accordion.multi()).toBe(false);
    host.multi.set(true);
    fixture.detectChanges();
    expect(accordion.multi()).toBe(true);
  });

  it('forwards a seeded [openIds] into the hosted brain and round-trips changes', () => {
    const { fixture, host, accordion } = setup();
    host.multi.set(true);
    host.open.set(new Set(['a']));
    fixture.detectChanges();
    expect(accordion.isOpen('a')).toBe(true);

    accordion.toggle('b');
    fixture.detectChanges();
    expect([...host.open()].sort()).toEqual(['a', 'b']);
  });

  it('omits [data-skin] when no skin is bound or configured', () => {
    const { el } = setup();
    expect(el.hasAttribute('data-skin')).toBe(false);
  });

  it('reflects a bound [skin] onto the [data-skin] host attribute', () => {
    const { fixture, host, el } = setup();
    host.skin.set('ledger');
    fixture.detectChanges();
    expect(el.getAttribute('data-skin')).toBe('ledger');

    host.skin.set(undefined);
    fixture.detectChanges();
    expect(el.hasAttribute('data-skin')).toBe(false);
  });
});

describe('CngxDataGridAccordion skin cascade', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideDataGridAccordionConfig(withDataGridSkin('metrics'))],
    }),
  );

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const de = fixture.debugElement.query(By.directive(CngxDataGridAccordion));
    return { fixture, host: fixture.componentInstance, el: de.nativeElement as HTMLElement };
  }

  it('falls back to the configured skin when [skin] is unbound', () => {
    const { el } = setup();
    expect(el.getAttribute('data-skin')).toBe('metrics');
  });

  it('lets a per-instance [skin] win over the configured default', () => {
    const { fixture, host, el } = setup();
    host.skin.set('terminal');
    fixture.detectChanges();
    expect(el.getAttribute('data-skin')).toBe('terminal');
  });
});
