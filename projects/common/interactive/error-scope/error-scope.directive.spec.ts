import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';
import { CngxErrorRegistry } from '../error-registry/error-registry';
import { provideErrorRegistry } from '../error-registry/provide-error-registry';
import { CngxErrorScope } from './error-scope.directive';
import { CNGX_ERROR_SCOPE } from './error-scope.token';

@Component({
  template: `<div cngxErrorScope [cngxErrorScopeName]="name()"></div>`,
  imports: [CngxErrorScope],
})
class RenameHost {
  readonly name = signal<string | undefined>('one');
}

@Component({
  selector: 'cngx-test-probe',
  template: '',
  standalone: true,
})
class Probe {
  scope = inject(CNGX_ERROR_SCOPE, { optional: true });
}

@Component({
  template: `
    <div cngxErrorScope cngxErrorScopeName="test-scope" #s="cngxErrorScope">
      <cngx-test-probe />
    </div>
  `,
  imports: [CngxErrorScope, Probe],
})
class TestHost {}

function setup() {
  const fixture = TestBed.createComponent(TestHost);
  fixture.detectChanges();
  const dirEl = fixture.debugElement.query(By.directive(CngxErrorScope));
  const dir = dirEl.injector.get(CngxErrorScope);
  const probeEl = fixture.debugElement.query(By.directive(Probe));
  const probe = probeEl.componentInstance as Probe;
  return { fixture, dir, probe };
}

describe('CngxErrorScope', () => {
  it('starts with showErrors=false and provides CNGX_ERROR_SCOPE to descendants', () => {
    const { dir, probe } = setup();
    expect(dir.showErrors()).toBe(false);
    expect(probe.scope).toBe(dir);
    expect(probe.scope?.scopeName?.()).toBe('test-scope');
  });

  it('reveal() flips showErrors to true; reset() flips back', () => {
    const { fixture, dir } = setup();
    dir.reveal();
    fixture.detectChanges();
    expect(dir.showErrors()).toBe(true);
    dir.reset();
    fixture.detectChanges();
    expect(dir.showErrors()).toBe(false);
  });

  it('reveal() / reset() are idempotent', () => {
    const { dir } = setup();
    dir.reveal();
    dir.reveal();
    expect(dir.showErrors()).toBe(true);
    dir.reset();
    dir.reset();
    expect(dir.showErrors()).toBe(false);
  });
});

describe('CngxErrorScope registry registration', () => {
  it('re-registers under the new name when cngxErrorScopeName changes', async () => {
    TestBed.configureTestingModule({ providers: [provideErrorRegistry()] });
    const fixture = TestBed.createComponent(RenameHost);
    fixture.detectChanges();
    await fixture.whenStable();
    TestBed.flushEffects();

    const registry = TestBed.inject(CngxErrorRegistry);
    expect(registry.getScope('one')).toBeDefined();

    fixture.componentInstance.name.set('two');
    TestBed.flushEffects();
    expect(registry.getScope('one')).toBeUndefined();
    expect(registry.getScope('two')).toBeDefined();

    // Clearing the name unregisters without re-registering.
    fixture.componentInstance.name.set(undefined);
    TestBed.flushEffects();
    expect(registry.getScope('two')).toBeUndefined();
  });

  it('unregisters on destroy', async () => {
    TestBed.configureTestingModule({ providers: [provideErrorRegistry()] });
    const fixture = TestBed.createComponent(RenameHost);
    fixture.detectChanges();
    await fixture.whenStable();
    TestBed.flushEffects();

    const registry = TestBed.inject(CngxErrorRegistry);
    expect(registry.getScope('one')).toBeDefined();

    fixture.destroy();
    expect(registry.getScope('one')).toBeUndefined();
  });
});
