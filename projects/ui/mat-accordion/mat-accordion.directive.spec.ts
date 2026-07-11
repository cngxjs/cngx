import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatAccordion, MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { By } from '@angular/platform-browser';
import { describe, expect, test } from 'vitest';

import { CNGX_ACCORDION, CngxAccordion } from '@cngx/common/interactive';

import { CngxMatAccordion } from './mat-accordion.directive';

@Component({
  standalone: true,
  imports: [MatExpansionModule, CngxMatAccordion],
  template: `
    <mat-accordion cngxMatAccordion [multi]="multi()">
      <mat-expansion-panel>
        <mat-expansion-panel-header>A</mat-expansion-panel-header>
        <p>a</p>
      </mat-expansion-panel>
      <mat-expansion-panel>
        <mat-expansion-panel-header>B</mat-expansion-panel-header>
        <p>b</p>
      </mat-expansion-panel>
    </mat-accordion>
  `,
})
class HostCmp {
  readonly multi = signal(false);
}

interface Plumbing {
  fixture: ReturnType<typeof TestBed.createComponent<HostCmp>>;
  host: HostCmp;
  matAccordion: MatAccordion;
  accordion: CngxAccordion;
  panels: MatExpansionPanel[];
}

async function setup(): Promise<Plumbing> {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(HostCmp);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  await fixture.whenStable();
  const accEl = fixture.debugElement.query(By.directive(MatAccordion));
  const matAccordion = accEl.injector.get(MatAccordion);
  const accordion = accEl.injector.get(CngxAccordion);
  const panels = fixture.debugElement
    .queryAll(By.directive(MatExpansionPanel))
    .map((el) => el.injector.get(MatExpansionPanel));
  return { fixture, host: fixture.componentInstance, matAccordion, accordion, panels };
}

async function settle(fixture: Plumbing['fixture']): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  TestBed.flushEffects();
}

describe('CngxMatAccordion', () => {
  test('pins Material multi=true even when [multi]="false" is bound; the brain arbitrates', async () => {
    const { fixture, host, matAccordion, accordion } = await setup();

    expect(host.multi()).toBe(false);
    expect(accordion.multi()).toBe(false);
    // Material's own multi is forced true so it never runs its own
    // single-open close; the cngx clamp is authoritative.
    expect(matAccordion.multi).toBe(true);

    host.multi.set(true);
    await settle(fixture);
    expect(matAccordion.multi).toBe(true);
  });

  test('Material→brain and brain→Material: expansion mirrors the openIds model', async () => {
    const { fixture, accordion, panels } = await setup();

    panels[0].expanded = true;
    await settle(fixture);
    expect(accordion.openIds().size).toBe(1);
    const [id0] = [...accordion.openIds()];

    accordion.openIds.set(new Set());
    await settle(fixture);
    expect(panels[0].expanded).toBe(false);

    accordion.openIds.set(new Set([id0]));
    await settle(fixture);
    expect(panels[0].expanded).toBe(true);
  });

  test('single-open: opening a second panel closes the first; openIds holds only the last id', async () => {
    const { fixture, accordion, panels } = await setup();

    panels[0].expanded = true;
    await settle(fixture);
    panels[1].expanded = true;
    await settle(fixture);

    expect(panels[0].expanded).toBe(false);
    expect(panels[1].expanded).toBe(true);
    expect(accordion.openIds().size).toBe(1);
  });

  test('provides CNGX_ACCORDION on the host element', async () => {
    const { fixture, accordion } = await setup();
    const accEl = fixture.debugElement.query(By.directive(MatAccordion));
    expect(accEl.injector.get(CNGX_ACCORDION)).toBe(accordion);
  });
});
