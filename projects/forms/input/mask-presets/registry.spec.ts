import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ensureMaskPreset,
  maskPresetTables,
  provideEagerMaskPresets,
  resetMaskPresetsForTesting,
} from './registry';

describe('resetMaskPresetsForTesting', () => {
  it('clears loaded tables so the lazy-load path starts cold again', async () => {
    await ensureMaskPreset('zip');
    expect(maskPresetTables().zip).toBeDefined();

    resetMaskPresetsForTesting();
    expect(maskPresetTables().zip).toBeUndefined();

    // A fresh ensure re-imports and repopulates.
    await ensureMaskPreset('zip');
    expect(maskPresetTables().zip).toBeDefined();
  });
});

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
