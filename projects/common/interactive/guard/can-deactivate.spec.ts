import { DOCUMENT } from '@angular/common';
import { Component, EnvironmentInjector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, type CanDeactivateFn } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { describe, expect, it, vi } from 'vitest';
import { provideCngxI18n, withDocumentLanguage, withPartialPack } from '@cngx/core/i18n';
import { canDeactivateWhenClean } from './can-deactivate';

@Component({ template: '<p>edit</p>' })
class EditPage {
  readonly dirty = signal(false);
  isDirty(): boolean {
    return this.dirty();
  }
}

@Component({ template: '<p>home</p>' })
class HomePage {}

describe('canDeactivateWhenClean', () => {
  function runGuard(guard: (component: never) => boolean): boolean {
    const injector = TestBed.inject(EnvironmentInjector);
    return runInInjectionContext(injector, () => guard(undefined as never));
  }

  async function editRoute(confirmResult: boolean) {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(confirmResult);
    const guard: CanDeactivateFn<EditPage> = canDeactivateWhenClean((page: EditPage) =>
      page.isDirty(),
    );
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'edit', component: EditPage, canDeactivate: [guard] },
          { path: 'home', component: HomePage },
        ]),
      ],
    });
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/edit', EditPage);
    return { harness, page, confirmSpy, router: TestBed.inject(Router) };
  }

  it('reads the dirty state from the routed component on a Router navigation', async () => {
    const { harness, page, confirmSpy, router } = await editRoute(false);
    page.dirty.set(true);
    await harness.navigateByUrl('/home');
    expect(router.url).toBe('/edit');
    expect(confirmSpy).toHaveBeenCalledTimes(1);

    page.dirty.set(false);
    await harness.navigateByUrl('/home');
    expect(router.url).toBe('/home');
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    confirmSpy.mockRestore();
  });

  it('leaves a dirty route when the user confirms', async () => {
    const { harness, page, confirmSpy, router } = await editRoute(true);
    page.dirty.set(true);
    await harness.navigateByUrl('/home');
    expect(router.url).toBe('/home');
    confirmSpy.mockRestore();
  });

  it('allows navigation without a window (SSR) and never asks', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: { defaultView: null } }],
    });
    const confirmSpy = vi.spyOn(window, 'confirm');
    expect(runGuard(canDeactivateWhenClean(() => true))).toBe(true);
    expect(confirmSpy).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

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
