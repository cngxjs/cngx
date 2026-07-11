import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxAccordion } from '@cngx/common/interactive';

import { CngxAccordionGroup } from './accordion-group.component';
import { CNGX_ACCORDION_GROUP } from './accordion-group.token';
import type { CngxAccordionSkin } from './config/accordion.config';
import { withAccordionSkin } from './config/features';
import { provideAccordionConfig } from './config/provide-accordion-config';

@Component({
  template: `<cngx-accordion-group
    [multi]="multi()"
    [headingLevel]="level()"
    [skin]="skin()"
    [(openIds)]="open"
  ></cngx-accordion-group>`,
  imports: [CngxAccordionGroup],
})
class Host {
  readonly multi = signal(false);
  readonly level = signal<number | string>(3);
  readonly skin = signal<CngxAccordionSkin | undefined>(undefined);
  readonly open = signal<ReadonlySet<string>>(new Set());
}

describe('CngxAccordionGroup', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const de = fixture.debugElement.query(By.directive(CngxAccordionGroup));
    return {
      fixture,
      host: fixture.componentInstance,
      group: de.injector.get(CngxAccordionGroup),
      accordion: de.injector.get(CngxAccordion),
    };
  }

  it('provides CNGX_ACCORDION_GROUP resolving to the group', () => {
    const { fixture } = setup();
    const de = fixture.debugElement.query(By.directive(CngxAccordionGroup));
    expect(de.injector.get(CNGX_ACCORDION_GROUP)).toBe(de.injector.get(CngxAccordionGroup));
  });

  it('defaults heading level to 3', () => {
    const { group } = setup();
    expect(group.headingLevel()).toBe(3);
  });

  it('clamps heading level into the ARIA 2-6 range', () => {
    const { fixture, host, group } = setup();
    host.level.set(4);
    fixture.detectChanges();
    expect(group.headingLevel()).toBe(4);

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

  it('forwards [multi] to the hosted CngxAccordion brain', () => {
    const { fixture, host, accordion } = setup();
    expect(accordion.multi()).toBe(false);
    host.multi.set(true);
    fixture.detectChanges();
    expect(accordion.multi()).toBe(true);
  });

  it('forwards a seeded [openIds] into the hosted brain', () => {
    const { fixture, host, accordion } = setup();
    host.open.set(new Set(['a']));
    fixture.detectChanges();
    expect(accordion.isOpen('a')).toBe(true);
  });

  it('round-trips (openIdsChange) back to the host on toggle', () => {
    const { fixture, host, accordion } = setup();
    accordion.toggle('a');
    fixture.detectChanges();
    expect([...host.open()]).toEqual(['a']);
  });

  it('omits [data-skin] when no skin is bound or configured', () => {
    const { fixture } = setup();
    const el = fixture.debugElement.query(By.directive(CngxAccordionGroup)).nativeElement;
    expect(el.hasAttribute('data-skin')).toBe(false);
  });

  it('reflects a bound [skin] onto the [data-skin] host attribute', () => {
    const { fixture, host } = setup();
    const el = fixture.debugElement.query(By.directive(CngxAccordionGroup)).nativeElement;
    host.skin.set('categorized');
    fixture.detectChanges();
    expect(el.getAttribute('data-skin')).toBe('categorized');

    host.skin.set(undefined);
    fixture.detectChanges();
    expect(el.hasAttribute('data-skin')).toBe(false);
  });
});

describe('CngxAccordionGroup skin cascade', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideAccordionConfig(withAccordionSkin('bento'))],
    }),
  );

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const de = fixture.debugElement.query(By.directive(CngxAccordionGroup));
    return { fixture, host: fixture.componentInstance, group: de.injector.get(CngxAccordionGroup), el: de.nativeElement as HTMLElement };
  }

  it('falls back to the configured skin when [skin] is unbound', () => {
    const { el } = setup();
    expect(el.getAttribute('data-skin')).toBe('bento');
  });

  it('lets a per-instance [skin] win over the configured default', () => {
    const { fixture, host, el } = setup();
    host.skin.set('timeline');
    fixture.detectChanges();
    expect(el.getAttribute('data-skin')).toBe('timeline');
  });
});
