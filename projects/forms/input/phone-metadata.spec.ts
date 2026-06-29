import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  CNGX_PHONE_METADATA,
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
