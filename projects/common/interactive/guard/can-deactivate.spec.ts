import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { provideCngxI18n, withDocumentLanguage, withPartialPack } from '@cngx/core/i18n';
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

  it('asks with the unsavedChanges phrase of the active language when no message is given', () => {
    TestBed.configureTestingModule({});
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    runGuard(canDeactivateWhenClean(() => true));
    expect(confirmSpy).toHaveBeenLastCalledWith('You have unsaved changes. Leave anyway?');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideCngxI18n(
          withPartialPack({
            locale: 'de',
            interactive: { unsavedChanges: 'Ungespeichert. Trotzdem gehen?' },
          }),
          withDocumentLanguage('off'),
        ),
      ],
    });
    runGuard(canDeactivateWhenClean(() => true));
    expect(confirmSpy).toHaveBeenLastCalledWith('Ungespeichert. Trotzdem gehen?');
    confirmSpy.mockRestore();
  });
});
