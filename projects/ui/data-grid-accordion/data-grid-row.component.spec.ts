import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxAccordionPanel } from '@cngx/common/interactive';

import { CngxDataGridAccordion } from './data-grid-accordion.component';
import { CngxDataGridFooter } from './data-grid-footer.component';
import { CngxDataGridHeader } from './data-grid-header.component';
import { CngxDataGridRow } from './data-grid-row.component';
import { CngxDgCell } from './data-grid-cell.directive';
import type { CngxDataGridSeverity } from './config/data-grid-accordion.config';

@Component({
  template: `<cngx-data-grid-accordion columns="8ch 1fr auto" [multi]="true">
    <cngx-dga-header>
      <span cngxDgaCell>ID</span>
      <span cngxDgaCell>Name</span>
      <span cngxDgaCell align="end">Amount</span>
    </cngx-dga-header>
    <cngx-dga-row panelId="a" [severity]="sev()">
      <span cngxDgaCell>1</span>
      <span cngxDgaCell primary>Alpha</span>
      <span cngxDgaCell align="end">120</span>
      Detail A
    </cngx-dga-row>
    <cngx-dga-row panelId="b">
      <span cngxDgaCell>2</span>
      <span cngxDgaCell primary>Beta</span>
      <span cngxDgaCell align="end">80</span>
      Detail B
    </cngx-dga-row>
    <cngx-dga-footer>
      <span cngxDgaCell>Total</span>
    </cngx-dga-footer>
  </cngx-data-grid-accordion>`,
  imports: [
    CngxDataGridAccordion,
    CngxDataGridRow,
    CngxDataGridHeader,
    CngxDataGridFooter,
    CngxDgCell,
  ],
})
class Host {
  readonly sev = signal<CngxDataGridSeverity | undefined>(undefined);
}

function keydown(el: HTMLElement, key: string): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

describe('CngxDataGridRow', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const rows = fixture.debugElement
      .queryAll(By.directive(CngxDataGridRow))
      .map((de) => de.nativeElement as HTMLElement);
    const buttons = fixture.debugElement
      .queryAll(By.directive(CngxAccordionPanel))
      .map((de) => de.nativeElement as HTMLElement);
    return { fixture, host: fixture.componentInstance, rows, buttons };
  }

  it('renders each row as a role="heading" carrying the group aria-level', () => {
    const { fixture } = setup();
    const headings = fixture.debugElement.nativeElement.querySelectorAll(
      '.cngx-dga-row__heading',
    ) as NodeListOf<HTMLElement>;
    expect(headings.length).toBe(2);
    headings.forEach((h) => expect(h.getAttribute('aria-level')).toBe('3'));
  });

  it('wires the summary button aria-controls at its region and starts collapsed', () => {
    const { fixture, buttons } = setup();
    const region = fixture.debugElement.nativeElement.querySelector(
      '.cngx-dga-row__region',
    ) as HTMLElement;
    expect(buttons[0].getAttribute('aria-controls')).toBe(region.id);
    expect(buttons.every((b) => b.getAttribute('aria-expanded') === 'false')).toBe(true);
  });

  it('names the button and region by the primary cell only', () => {
    const { fixture } = setup();
    const firstRow = fixture.debugElement.queryAll(By.directive(CngxDataGridRow))[0]
      .nativeElement as HTMLElement;
    const button = firstRow.querySelector('.cngx-dga-row__summary') as HTMLElement;
    const region = firstRow.querySelector('.cngx-dga-row__region') as HTMLElement;
    const primaryCell = firstRow.querySelector('[data-primary]') as HTMLElement;

    expect(primaryCell.textContent?.trim()).toBe('Alpha');
    expect(button.getAttribute('aria-labelledby')).toBe(primaryCell.id);
    expect(region.getAttribute('aria-labelledby')).toBe(primaryCell.id);
  });

  it('opens the region on click and toggles its [hidden] flag', () => {
    const { fixture, rows, buttons } = setup();
    const region = rows[0].querySelector('.cngx-dga-row__region') as HTMLElement;
    expect(region.hidden).toBe(true);

    buttons[0].click();
    fixture.detectChanges();
    expect(buttons[0].getAttribute('aria-expanded')).toBe('true');
    expect(region.hidden).toBe(false);
    expect(rows[0].hasAttribute('data-expanded')).toBe(true);
  });

  it('reflects [severity] onto the row [data-severity] host attribute', () => {
    const { fixture, host, rows } = setup();
    expect(rows[0].hasAttribute('data-severity')).toBe(false);

    host.sev.set('error');
    fixture.detectChanges();
    expect(rows[0].getAttribute('data-severity')).toBe('error');
  });

  it('roves the tab stop between row summaries on ArrowDown / ArrowUp', () => {
    const { fixture, buttons } = setup();
    expect(buttons[0].getAttribute('tabindex')).toBe('0');
    expect(buttons[1].getAttribute('tabindex')).toBe('-1');

    buttons[0].focus();
    keydown(buttons[0], 'ArrowDown');
    fixture.detectChanges();
    expect(document.activeElement).toBe(buttons[1]);
    expect(buttons[1].getAttribute('tabindex')).toBe('0');

    keydown(buttons[1], 'ArrowUp');
    fixture.detectChanges();
    expect(document.activeElement).toBe(buttons[0]);
    expect(buttons[0].getAttribute('tabindex')).toBe('0');
  });

  it('keeps the header and footer announced (neither aria-hidden)', () => {
    // The header is exposed to AT so a `cngxDgaSortHeader` sort control inside it stays
    // reachable - a focusable control in an aria-hidden subtree fails aria-hidden-focus.
    const { fixture } = setup();
    const header = fixture.debugElement.query(By.directive(CngxDataGridHeader))
      .nativeElement as HTMLElement;
    const footer = fixture.debugElement.query(By.directive(CngxDataGridFooter))
      .nativeElement as HTMLElement;
    expect(header.hasAttribute('aria-hidden')).toBe(false);
    expect(footer.hasAttribute('aria-hidden')).toBe(false);
  });

  it('lays header, rows, and footer on one shared --cngx-dga-columns contract', () => {
    const { fixture } = setup();
    const group = fixture.debugElement.query(By.directive(CngxDataGridAccordion))
      .nativeElement as HTMLElement;
    // The group publishes the single column template; header/summary/footer all
    // read the inherited property in CSS, so one host value drives all three.
    expect(group.style.getPropertyValue('--cngx-dga-columns')).toBe('8ch 1fr auto');
  });
});
