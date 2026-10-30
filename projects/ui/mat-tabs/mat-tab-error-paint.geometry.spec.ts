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
  // The rejection icon, appended to the tab as the projector does.
  const icon = document.createElement('span');
  icon.className = 'cngx-mat-tab__rejection-icon';
  icon.dataset['reason'] = 'failed';
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML =
    '<svg class="cngx-mat-tab__icon-svg cngx-mat-tab__icon-svg--stroke" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" overflow="visible" style="inline-size: var(--cngx-icon-svg-size, 1em); block-size: var(--cngx-icon-svg-size, 1em); stroke-width: var(--cngx-icon-svg-stroke-width, 2)"><path d="M12 9v4"/></svg>';
  tabs[0].appendChild(icon);
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

  it('paints a failed tab by colour only: error label, no outline', async () => {
    const [failed, resting] = await mount();
    expect(failed.classList.contains('mdc-tab--active')).toBe(true);
    const style = getComputedStyle(failed);
    expect(style.outlineStyle).toBe('none');
    expect(style.fontWeight).toBe('600');
    // Material transitions the label colour; poll past it.
    await expect.poll(() => label(failed)).toBe(style.color);
    expect(label(failed)).not.toBe(label(resting));
  });

  it('paints a refused tab label amber, apart from the failed and the resting one', async () => {
    const [failed, resting, refused] = await mount();
    expect(getComputedStyle(refused).outlineStyle).toBe('none');
    await expect.poll(() => label(refused)).toBe(getComputedStyle(refused).color);
    expect(label(refused)).not.toBe(label(resting));
    expect(label(refused)).not.toBe(getComputedStyle(failed).color);
  });

  it('lays the rejection icon after the label in the real Material tab', async () => {
    const [failed] = await mount();
    const text = failed.querySelector('.mdc-tab__text-label')!.getBoundingClientRect();
    const icon = failed.querySelector('.cngx-mat-tab__rejection-icon')!.getBoundingClientRect();
    expect(icon.width).toBeGreaterThan(0);
    expect(icon.left).toBeGreaterThanOrEqual(text.right);
    expect(icon.top + icon.height / 2).toBeCloseTo(text.top + text.height / 2, 0);
  });
});
