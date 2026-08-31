import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { TestBed } from '@angular/core/testing';
import { CngxLiveAnnouncer } from '@cngx/common/a11y';
import { injectA11yPreferences, provideA11yPreferences } from '@cngx/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CngxA11yPanel } from './a11y-panel.component';
import { provideA11yPanelConfig, withA11yPanelLabels } from './a11y-panel.config';

const attr = (name: string) => document.documentElement.getAttribute(name);

function setup(announce = vi.fn()) {
  TestBed.configureTestingModule({
    providers: [
      provideA11yPreferences(),
      { provide: CngxLiveAnnouncer, useValue: { announce } },
    ],
  });
  const fixture = TestBed.createComponent(CngxA11yPanel);
  fixture.detectChanges();
  const prefs = TestBed.runInInjectionContext(() => injectA11yPreferences());
  return { fixture, prefs, announce };
}

const groups = (fixture: { nativeElement: HTMLElement }) =>
  Array.from(fixture.nativeElement.querySelectorAll('cngx-button-toggle-group'));

describe('CngxA11yPanel', () => {
  afterEach(() => {
    for (const name of ['data-density', 'data-text-size', 'data-motion', 'data-contrast']) {
      document.documentElement.removeAttribute(name);
    }
  });

  it('renders one control group per configured axis (4 by default)', () => {
    const { fixture } = setup();
    expect(groups(fixture)).toHaveLength(4);
  });

  it('renders the default heading and each axis group label from the config', () => {
    const { fixture } = setup();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.cngx-a11y-panel__heading')?.textContent?.trim()).toBe(
      'Accessibility',
    );
    const labels = Array.from(host.querySelectorAll('.cngx-a11y-panel__axis-label')).map((el) =>
      el.textContent?.trim(),
    );
    expect(labels).toEqual(['Spacing', 'Text size', 'Motion', 'Contrast']);

    // Each group takes its accessible name from the visible label via
    // aria-labelledby (Pillar 2: the visible text IS the programmatic name).
    const densityGroup = groups(fixture)[0] as HTMLElement;
    const labelId = densityGroup.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    expect(host.querySelector(`#${labelId}`)?.textContent?.trim()).toBe('Spacing');
  });

  it('reflects overridden axis labels from withA11yPanelLabels', () => {
    TestBed.configureTestingModule({
      providers: [
        provideA11yPreferences(),
        provideA11yPanelConfig(withA11yPanelLabels({ axes: { motion: 'Bewegung' } })),
        { provide: CngxLiveAnnouncer, useValue: { announce: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(CngxA11yPanel);
    fixture.detectChanges();
    const labels = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.cngx-a11y-panel__axis-label'),
    ).map((el) => el.textContent?.trim());
    expect(labels).toContain('Bewegung');
  });

  it('writes the axis signal and reflects onto <html> when a toggle is picked', () => {
    const { fixture, prefs } = setup();
    // First group is density; its first option is `compact`.
    const compactButton = (groups(fixture)[0] as HTMLElement).querySelector(
      'button',
    ) as HTMLButtonElement;
    expect(compactButton.textContent?.trim()).toBe('Compact');

    compactButton.click();
    TestBed.flushEffects();

    expect(prefs.density()).toBe('compact');
    expect(attr('data-density')).toBe('compact');
  });

  it('restores every axis default and announces on Reset', () => {
    const { fixture, prefs, announce } = setup();

    prefs.density.set('spacious');
    prefs.textScale.set('lg');
    prefs.motion.set('reduced');
    prefs.contrast.set('more');
    TestBed.flushEffects();

    const resetButton = (fixture.nativeElement as HTMLElement).querySelector(
      '.cngx-a11y-panel__reset',
    ) as HTMLButtonElement;
    resetButton.click();
    TestBed.flushEffects();

    expect(prefs.density()).toBe('comfortable');
    expect(prefs.textScale()).toBe('md');
    expect(prefs.motion()).toBe('auto');
    expect(prefs.contrast()).toBe('auto');
    expect(announce).toHaveBeenCalledWith('Preferences reset to defaults');

    // Reflectors follow: density always sets its attribute, motion/contrast
    // drop theirs on `auto`.
    expect(attr('data-density')).toBe('comfortable');
    expect(attr('data-motion')).toBeNull();
  });

  it('layers every stylesheet rule so the theme bridge and consumer overrides win', () => {
    // jsdom does not evaluate @layer; asserted the way the density spec below
    // reads CSS source. Every rule must sit inside @layer cngx.components -
    // an unlayered rule would beat the @layer'd Material bridge (cngx.theme).
    const css = readFileSync(resolve(__dirname, 'a11y-panel.component.css'), 'utf-8');
    expect(css).toContain('@layer cngx.components {');
    expect(css.indexOf('@layer cngx.components {')).toBeLessThan(
      css.indexOf('.cngx-a11y-panel'),
    );
  });

  it('SETs every --cngx-a11y-panel spacing token from the density scale', () => {
    // jsdom does not resolve the custom-property cascade, so the density-
    // tracking claim is verified the way the touch-target guard reads CSS
    // source: each spacing token must be assigned from var(--cngx-space-*).
    const css = readFileSync(resolve(__dirname, 'a11y-panel.component.css'), 'utf-8');
    for (const token of ['gap', 'axis-gap', 'reset-pad-x', 'reset-pad-y']) {
      expect(css).toContain(`--cngx-a11y-panel-${token}: var(--cngx-space-`);
    }
  });
});
