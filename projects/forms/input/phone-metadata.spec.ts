import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  CNGX_PHONE_METADATA,
  createPrefixPhoneMetadata,
  providePhoneMetadata,
  type CngxPhoneMetadata,
} from './phone-metadata';

const mobileAdapter: CngxPhoneMetadata = {
  lineType: (_region, national) => (/^1[567]/.test(national) ? 'mobile' : 'unknown'),
};

describe('CNGX_PHONE_METADATA', () => {
  it('resolves the default strategy returning unknown', () => {
    const metadata = TestBed.runInInjectionContext(() => inject(CNGX_PHONE_METADATA));
    expect(metadata.lineType('DE', '15123')).toBe('unknown');
  });

  it('overrides the default through providePhoneMetadata in root providers', () => {
    TestBed.configureTestingModule({ providers: [providePhoneMetadata(mobileAdapter)] });
    const metadata = TestBed.runInInjectionContext(() => inject(CNGX_PHONE_METADATA));
    expect(metadata.lineType('DE', '15123')).toBe('mobile');
    expect(metadata.lineType('DE', '30123')).toBe('unknown');
  });

  it('overrides the default through providePhoneMetadata in viewProviders', () => {
    @Component({
      selector: 'cngx-phone-metadata-host',
      standalone: true,
      template: '',
      viewProviders: [providePhoneMetadata(mobileAdapter)],
    })
    class Host {
      readonly metadata = inject(CNGX_PHONE_METADATA);
    }

    const fixture = TestBed.createComponent(Host);
    expect(fixture.componentInstance.metadata.lineType('DE', '17012')).toBe('mobile');
  });
});

describe('createPrefixPhoneMetadata', () => {
  const metadata = createPrefixPhoneMetadata({
    DE: { mobile: [/^1[567]/] },
    AT: { mobile: ['650', '660', '664', '676', '699'] },
  });

  it('matches a RegExp prefix rule at the start of the national digits', () => {
    expect(metadata.lineType('DE', '15123456')).toBe('mobile');
    expect(metadata.lineType('DE', '17012345')).toBe('mobile');
  });

  it('matches literal string prefixes', () => {
    expect(metadata.lineType('AT', '6641234567')).toBe('mobile');
    expect(metadata.lineType('AT', '6991234567')).toBe('mobile');
  });

  it('returns unknown when no prefix matches', () => {
    expect(metadata.lineType('DE', '30123456')).toBe('unknown');
    expect(metadata.lineType('AT', '1234567')).toBe('unknown');
  });

  it('returns unknown for an unconfigured region', () => {
    expect(metadata.lineType('US', '2025550123')).toBe('unknown');
  });

  it('ignores a RegExp that matches mid-number, not at the start', () => {
    const mid = createPrefixPhoneMetadata({ DE: { mobile: [/15/] } });
    expect(mid.lineType('DE', '30150000')).toBe('unknown');
    expect(mid.lineType('DE', '15000000')).toBe('mobile');
  });

  it('resolves the longest matching prefix across line types', () => {
    const overlap = createPrefixPhoneMetadata({
      AT: { mobile: ['8'], fixedLine: ['820'] },
    });
    // '820...' matches both '8' (mobile) and '820' (fixedLine); the longer wins.
    expect(overlap.lineType('AT', '8201234')).toBe('fixedLine');
    expect(overlap.lineType('AT', '8991234')).toBe('mobile');
  });

  it('resolves ties in favour of mobile', () => {
    const tie = createPrefixPhoneMetadata({
      AT: { mobile: ['66'], fixedLine: ['66'] },
    });
    expect(tie.lineType('AT', '6612345')).toBe('mobile');
  });

  it('is stable across calls even with a global-flagged RegExp', () => {
    const global = createPrefixPhoneMetadata({ DE: { mobile: [/^1[567]/g] } });
    expect(global.lineType('DE', '15100000')).toBe('mobile');
    expect(global.lineType('DE', '15100000')).toBe('mobile');
  });

  it('separates AT mobile NDCs from the 1-7 geographic landline ranges', () => {
    const at = createPrefixPhoneMetadata({
      AT: {
        mobile: ['650', '660', '664', '676', '699'],
        fixedLine: ['1', '2', '3', '4', '5', '6', '7'],
      },
    });
    expect(at.lineType('AT', '6641234567')).toBe('mobile'); // 0664 mobile
    expect(at.lineType('AT', '6621234567')).toBe('fixedLine'); // 0662 Salzburg landline
    expect(at.lineType('AT', '3161234567')).toBe('fixedLine'); // 0316 Graz
    expect(at.lineType('AT', '5121234567')).toBe('fixedLine'); // 0512 Innsbruck
    expect(at.lineType('AT', '11234567')).toBe('fixedLine'); // 01 Vienna
  });

  it('plugs into the DI token through providePhoneMetadata', () => {
    TestBed.configureTestingModule({ providers: [providePhoneMetadata(metadata)] });
    const resolved = TestBed.runInInjectionContext(() => inject(CNGX_PHONE_METADATA));
    expect(resolved.lineType('AT', '6601234567')).toBe('mobile');
  });
});
