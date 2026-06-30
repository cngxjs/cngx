import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { maskPresetTables, provideEagerMaskPresets } from './registry';

describe('provideEagerMaskPresets', () => {
  it('loads the requested preset table during app init', async () => {
    TestBed.configureTestingModule({ providers: [provideEagerMaskPresets('zip')] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    expect(maskPresetTables().zip).toBeDefined();
  });

  it('loads every table when no keys are given', async () => {
    TestBed.configureTestingModule({ providers: [provideEagerMaskPresets()] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    const tables = maskPresetTables();
    expect(tables.phone).toBeDefined();
    expect(tables.date).toBeDefined();
    expect(tables.iban).toBeDefined();
    expect(tables.zip).toBeDefined();
  });
});
