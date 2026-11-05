import { Component, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CNGX_BUTTON_CONFIG,
  provideButtonConfig,
  withButtonSize,
  withButtonVariant,
} from './button-config';
import { CNGX_BUTTON_SPINNER } from './button-spinner.token';
import { CNGX_CLOSE_ICON } from './close-button.component';
import {
  provideCngxButton,
  provideCngxButtonAt,
  withButtonCloseIcon,
  withButtonSpinner,
  type CngxButtonFeature,
} from './provide-cngx-button';

@Component({ selector: 'demo-x', template: 'x' })
class DemoX {}

@Component({ selector: 'demo-dots', template: '...' })
class DemoDots {}

describe('provideCngxButton', () => {
  afterEach(() => vi.restoreAllMocks());

  it('dispatches config, close glyph and busy glyph in one call', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCngxButton(
          withButtonVariant('outline'),
          withButtonSize('sm'),
          withButtonCloseIcon(DemoX),
          withButtonSpinner(DemoDots),
        ),
      ],
    });
    expect(TestBed.inject(CNGX_BUTTON_CONFIG)).toEqual({ variant: 'outline', size: 'sm' });
    expect(TestBed.inject(CNGX_CLOSE_ICON)).toBe(DemoX);
    expect(TestBed.inject(CNGX_BUTTON_SPINNER)).toBe(DemoDots);
  });

  it('drops an unbranded feature with CNGX1041 and keeps the others', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const rogue = { config: { tone: 'danger' } } as unknown as CngxButtonFeature;
    TestBed.configureTestingModule({
      providers: [provideCngxButton(withButtonSize('lg'), rogue)],
    });
    expect(TestBed.inject(CNGX_BUTTON_CONFIG)).toEqual({ size: 'lg' });
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/^CNGX1041: provideCngxButton\(\): dropped feature/),
    );
  });
});

describe('provideCngxButtonAt', () => {
  afterEach(() => vi.restoreAllMocks());

  it('merges config over the parent scope and provides the glyphs on the subtree', () => {
    TestBed.configureTestingModule({ providers: [provideButtonConfig(withButtonSize('lg'))] });
    const child = Injector.create({
      providers: provideCngxButtonAt(withButtonVariant('ghost'), withButtonSpinner(DemoDots)),
      parent: TestBed.inject(Injector),
    });
    expect(child.get(CNGX_BUTTON_CONFIG)).toEqual({ size: 'lg', variant: 'ghost' });
    expect(child.get(CNGX_BUTTON_SPINNER)).toBe(DemoDots);
    expect(child.get(CNGX_CLOSE_ICON, null)).toBeNull();
  });

  it('plants no config without config features', () => {
    expect(provideCngxButtonAt(withButtonCloseIcon(DemoX))).toHaveLength(1);
  });

  it('names itself when it drops an unbranded feature', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    provideCngxButtonAt({} as unknown as CngxButtonFeature);
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/^CNGX1041: provideCngxButtonAt\(\): dropped feature/),
    );
  });
});
