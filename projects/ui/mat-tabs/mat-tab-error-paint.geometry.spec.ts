import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatTabsModule } from '@angular/material/tabs';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). Unlike the static
// markup specs next to it, this one renders a real `<mat-tab-group>`, so
// Material's own unlayered tab styles (`.mdc-tab { outline: none }`, the
// label colour on `.mdc-tab__text-label`) are in the cascade. The decoration
// classes are set by hand in the shape the projector writes.

@Component({
  selector: 'cngx-mat-tab-error-paint-host',
  standalone: true,
  imports: [MatTabsModule],
  styleUrls: ['../../core/theming/system-tokens.css', './styles/mat-tabs.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <mat-tab-group>
      <mat-tab label="Profile"><p>Profile</p></mat-tab>
      <mat-tab label="Account"><p>Account</p></mat-tab>
      <mat-tab label="Billing"><p>Billing</p></mat-tab>
    </mat-tab-group>
  `,
})
class MatTabErrorPaintHost {}

// oklch(0.45 0.15 25) and oklch(0.62 0.15 60) as Chromium serialises them.
const RED = 'oklch(0.45 0.15 25)';
const AMBER = 'oklch(0.62 0.15 60)';

let mountedRoot: HTMLElement | null = null;

async function mount(): Promise<HTMLElement[]> {
  const fixture = TestBed.createComponent(MatTabErrorPaintHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  await fixture.whenStable();
  const tabs = Array.from(mountedRoot.querySelectorAll<HTMLElement>('.mat-mdc-tab'));
  // The active tab fails (Material's (0,3,0) active label rule is in play),
  // the third is refused, the second stays a resting inactive tab.
  tabs[0].classList.add('cngx-mat-tab--error');
  tabs[0].dataset['reason'] = 'failed';
  tabs[2].classList.add('cngx-mat-tab--error');
  tabs[2].dataset['reason'] = 'refused';
  return tabs;
}

const label = (tab: HTMLElement): string =>
  getComputedStyle(tab.querySelector('.mdc-tab__text-label')!).color;

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('rejected mat tab paint over the Material tab styles', () => {
  it('loads the Material tab styles', async () => {
    const [, resting] = await mount();
    // `.mdc-tab` ships `min-width: 90px` and `outline: none`.
    expect(getComputedStyle(resting).minWidth).toBe('90px');
    expect(getComputedStyle(resting).outlineStyle).toBe('none');
  });

  it('paints a failed tab with a red outline and red label text', async () => {
    const [failed] = await mount();
    expect(failed.classList.contains('mdc-tab--active')).toBe(true);
    const style = getComputedStyle(failed);
    expect(style.outlineStyle).toBe('solid');
    expect(style.outlineWidth).toBe('2px');
    expect(style.outlineColor).toBe(RED);
    expect(style.fontWeight).toBe('600');
    // Material transitions the label colour; poll past it.
    await expect.poll(() => label(failed)).toBe(RED);
  });

  it('paints a refused tab with an amber outline and the resting label colour', async () => {
    const [, resting, refused] = await mount();
    const style = getComputedStyle(refused);
    expect(style.outlineStyle).toBe('solid');
    expect(style.outlineColor).toBe(AMBER);
    // Settle Material's label colour transition before comparing.
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(label(refused)).toBe(label(resting));
    expect(label(refused)).not.toBe(RED);
  });

  it('insets the outline so the clipped label container keeps every edge', async () => {
    const [failed] = await mount();
    expect(getComputedStyle(failed).outlineOffset).toBe('-2px');
  });
});
