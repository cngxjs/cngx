import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxAccordionGroup } from './accordion-group.component';
import { CngxAccordionItem } from './accordion-item.component';

@Component({
  template: `<cngx-accordion-group [headingLevel]="level()">
    <cngx-accordion-item><span cngxAccordionItemTitle>A</span>Body A</cngx-accordion-item>
    <cngx-accordion-item [disabled]="bDisabled()"
      ><span cngxAccordionItemTitle>B</span>Body B</cngx-accordion-item
    >
    <cngx-accordion-item><span cngxAccordionItemTitle>C</span>Body C</cngx-accordion-item>
  </cngx-accordion-group>`,
  imports: [CngxAccordionGroup, CngxAccordionItem],
})
class Host {
  readonly level = signal<number>(3);
  readonly bDisabled = signal(false);
}

describe('CngxAccordionItem', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const headers = fixture.debugElement
      .queryAll(By.css('button.cngx-accordion-item__header'))
      .map((de) => de.nativeElement as HTMLButtonElement);
    const regions = Array.from(root.querySelectorAll<HTMLElement>('[role="region"]'));
    return { fixture, root, host: fixture.componentInstance, headers, regions };
  }

  function keydown(el: HTMLElement, key: string): void {
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  }

  it('names each region back at its own header via aria-labelledby', () => {
    const { headers, regions } = setup();
    expect(regions).toHaveLength(3);
    regions.forEach((region, i) => {
      expect(region.getAttribute('role')).toBe('region');
      expect(region.getAttribute('aria-labelledby')).toBe(headers[i].id);
      expect(headers[i].id).toBeTruthy();
    });
  });

  it('reflects the group heading level onto every item heading', () => {
    const { fixture, root, host } = setup();
    host.level.set(4);
    fixture.detectChanges();
    const headings = root.querySelectorAll<HTMLElement>('[role="heading"]');
    expect(headings).toHaveLength(3);
    headings.forEach((h) => expect(h.getAttribute('aria-level')).toBe('4'));
  });

  it('roves focus and the tab stop ACROSS item view boundaries on ArrowDown', () => {
    const { fixture, headers } = setup();
    expect(headers[0].getAttribute('tabindex')).toBe('0');
    expect(headers[1].getAttribute('tabindex')).toBe('-1');

    headers[0].focus();
    keydown(headers[0], 'ArrowDown');
    fixture.detectChanges();

    expect(document.activeElement).toBe(headers[1]);
    expect(headers[0].getAttribute('tabindex')).toBe('-1');
    expect(headers[1].getAttribute('tabindex')).toBe('0');
  });

  it('skips a disabled item on ArrowDown and resolves its aria-describedby reason', () => {
    const { fixture, root, host, headers } = setup();
    host.bDisabled.set(true);
    fixture.detectChanges();

    expect(headers[1].getAttribute('aria-disabled')).toBe('true');
    const reasonId = headers[1].getAttribute('aria-describedby');
    expect(reasonId).toBeTruthy();
    const reason = root.querySelector<HTMLElement>(`#${reasonId}`);
    expect(reason?.textContent?.trim()).toBeTruthy();
    expect(reason?.getAttribute('aria-hidden')).toBe('false');

    headers[0].focus();
    keydown(headers[0], 'ArrowDown');
    fixture.detectChanges();
    expect(document.activeElement).toBe(headers[2]);
  });

  it('keeps the aria-describedby IDREF present but hidden when enabled', () => {
    const { headers, root } = setup();
    const reasonId = headers[1].getAttribute('aria-describedby');
    const reason = root.querySelector<HTMLElement>(`#${reasonId}`);
    expect(reason).not.toBeNull();
    expect(reason?.getAttribute('aria-hidden')).toBe('true');
    expect(reason?.textContent?.trim()).toBe('');
  });
});
