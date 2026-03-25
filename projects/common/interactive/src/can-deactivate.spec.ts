import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { canDeactivateWhenClean } from './can-deactivate';

describe('canDeactivateWhenClean', () => {
  function runGuard(guard: () => boolean): boolean {
    const injector = TestBed.inject(EnvironmentInjector);
    return runInInjectionContext(injector, guard);
  }

  it('allows navigation when not dirty', () => {
    TestBed.configureTestingModule({});
    const guard = canDeactivateWhenClean(() => false);
    expect(runGuard(guard)).toBe(true);
  });

  it('shows confirm dialog when dirty', () => {
    TestBed.configureTestingModule({});
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const guard = canDeactivateWhenClean(() => true, 'Leave?');

    expect(runGuard(guard)).toBe(true);
    expect(confirmSpy).toHaveBeenCalledWith('Leave?');
    confirmSpy.mockRestore();
  });

  it('blocks navigation when user cancels confirm', () => {
    TestBed.configureTestingModule({});
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const guard = canDeactivateWhenClean(() => true);

    expect(runGuard(guard)).toBe(false);
    confirmSpy.mockRestore();
  });
});
