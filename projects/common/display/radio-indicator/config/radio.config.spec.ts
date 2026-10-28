import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxRadioIndicator } from '../radio-indicator.component';
import { withRadioSkin } from './features';
import { injectRadioConfig } from './inject-radio-config';
import { provideRadioConfig, provideRadioConfigAt } from './provide-radio-config';
import type { CngxRadioConfig } from './radio.config';
import { CNGX_RADIO_CONFIG, CNGX_RADIO_DEFAULTS } from './radio.config.defaults';

@Component({
  imports: [CngxRadioIndicator],
  template: `<cngx-radio-indicator data-testid="plain" />`,
})
class PlainHost {}

@Component({
  imports: [CngxRadioIndicator],
  viewProviders: [provideRadioConfigAt(withRadioSkin('check'))],
  template: `<cngx-radio-indicator data-testid="scoped" />`,
})
class ScopedHost {}

@Component({
  selector: 'cngx-test-config-reader',
  template: '',
})
class ConfigReader {
  readonly config = injectRadioConfig();
}

@Component({
  imports: [ConfigReader],
  viewProviders: [provideRadioConfigAt()],
  template: `<cngx-test-config-reader />`,
})
class EmptyScopedHost {}

function skinOf(fixture: { nativeElement: HTMLElement; detectChanges: () => void }): string | null {
  fixture.detectChanges();
  return (
    fixture.nativeElement.querySelector('cngx-radio-indicator')?.getAttribute('data-skin') ?? null
  );
}

describe('CngxRadioConfig - resolution priority', () => {
  it('library default reaches the indicator when no provider is present', () => {
    expect(skinOf(TestBed.createComponent(PlainHost))).toBe('default');
  });

  it('provideRadioConfig at root overrides the library default', () => {
    TestBed.configureTestingModule({ providers: [provideRadioConfig(withRadioSkin('tinted'))] });
    expect(skinOf(TestBed.createComponent(PlainHost))).toBe('tinted');
  });

  it('provideRadioConfigAt overrides the root config for its sub-tree', () => {
    TestBed.configureTestingModule({ providers: [provideRadioConfig(withRadioSkin('tinted'))] });
    expect(skinOf(TestBed.createComponent(ScopedHost))).toBe('check');
    expect(skinOf(TestBed.createComponent(PlainHost))).toBe('tinted');
  });

  it('last withRadioSkin wins inside one provider call', () => {
    TestBed.configureTestingModule({
      providers: [provideRadioConfig(withRadioSkin('check'), withRadioSkin('tinted'))],
    });
    expect(skinOf(TestBed.createComponent(PlainHost))).toBe('tinted');
  });

  it('empty provideRadioConfig keeps the library defaults reference', () => {
    TestBed.configureTestingModule({ providers: [provideRadioConfig()] });
    const fixture = TestBed.createComponent(EmptyScopedHost);
    fixture.detectChanges();
    const reader: ConfigReader = fixture.debugElement.children[0].componentInstance;
    expect(reader.config).toBe(CNGX_RADIO_DEFAULTS);
  });

  it('empty provideRadioConfigAt keeps the parent config reference', () => {
    TestBed.configureTestingModule({ providers: [provideRadioConfig(withRadioSkin('check'))] });
    const fixture = TestBed.createComponent(EmptyScopedHost);
    fixture.detectChanges();
    const reader: ConfigReader = fixture.debugElement.children[0].componentInstance;
    const root: CngxRadioConfig = TestBed.inject(CNGX_RADIO_CONFIG);
    expect(reader.config).toBe(root);
  });
});
