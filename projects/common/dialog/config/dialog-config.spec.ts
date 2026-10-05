import { describe, it, expect, beforeEach } from 'vitest';
import { Component, computed, ElementRef, signal, viewChild } from '@angular/core';
import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
} from '@cngx/core/i18n';
import { coerceSignal } from '@cngx/core/utils';
import { TestBed } from '@angular/core/testing';

import { CngxDialog } from '../dialog/dialog.directive';
import { CngxDialogClose } from '../dialog/dialog-close.directive';
import { CngxDialogTitle } from '../dialog/dialog-title.directive';
import { CngxDialogDraggable } from '../draggable/dialog-draggable.directive';
import {
  CNGX_DIALOG_DEFAULTS,
  injectDialogConfig,
  provideDialogConfig,
  provideDialogConfigAt,
  withDialogLabels,
} from './dialog-config';

@Component({
  standalone: true,
  imports: [CngxDialog, CngxDialogClose, CngxDialogTitle, CngxDialogDraggable],
  template: `
    <dialog cngxDialog cngxDialogDraggable [handle]="handle()?.nativeElement" [open]="open()" [error]="error()">
      <h2 cngxDialogTitle>Title</h2>
      <span class="handle" #handleEl>drag</span>
      <button type="button" cngxDialogClose></button>
    </dialog>
  `,
})
class Host {
  readonly open = signal(true);
  readonly error = signal(false);
  readonly handle = viewChild<ElementRef<HTMLElement>>('handleEl');
}

const host = () => {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture;
};

describe('CNGX_DIALOG_DEFAULTS', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('ships the five English labels without any provider', () => {
    expect(coerceSignal(TestBed.inject(CNGX_DIALOG_DEFAULTS).labels)()).toEqual({
      close: 'Close dialog',
      errorFallback: 'An error occurred',
      dragHandle: 'Move dialog',
      dragHandleRoleDescription: 'draggable',
      dragInstructions: 'Use arrow keys to move the dialog; Shift for larger steps',
    });
  });

  it('keeps unset keys English when a partial bundle is provided', () => {
    TestBed.configureTestingModule({
      providers: [provideDialogConfig(withDialogLabels({ close: 'Dialog schließen' }))],
    });
    const labels = coerceSignal(TestBed.runInInjectionContext(() => injectDialogConfig()).labels)();
    expect(labels.close).toBe('Dialog schließen');
    expect(labels.dragHandle).toBe('Move dialog');
  });

  it('merges two withDialogLabels calls rather than replacing', () => {
    TestBed.configureTestingModule({
      providers: [
        provideDialogConfig(
          withDialogLabels({ close: 'Schließen' }),
          withDialogLabels({ dragHandle: 'Verschieben' }),
        ),
      ],
    });
    const labels = coerceSignal(TestBed.runInInjectionContext(() => injectDialogConfig()).labels)();
    expect(labels.close).toBe('Schließen');
    expect(labels.dragHandle).toBe('Verschieben');
  });

  it('names an empty close button from the bundle', () => {
    TestBed.configureTestingModule({
      providers: [provideDialogConfig(withDialogLabels({ close: 'Dialog schließen' }))],
    });
    const button = host().nativeElement.querySelector('button') as HTMLElement;
    expect(button.getAttribute('aria-label')).toBe('Dialog schließen');
  });

  it('labels the drag handle and its instruction from the bundle', () => {
    TestBed.configureTestingModule({
      providers: [
        provideDialogConfig(
          withDialogLabels({
            dragHandle: 'Dialog verschieben',
            dragHandleRoleDescription: 'verschiebbar',
            dragInstructions: 'Pfeiltasten bewegen den Dialog',
          }),
        ),
      ],
    });
    const fixture = host();
    const handle = fixture.nativeElement.querySelector('.handle') as HTMLElement;
    expect(handle.getAttribute('aria-label')).toBe('Dialog verschieben');
    expect(handle.getAttribute('aria-roledescription')).toBe('verschiebbar');

    const hint = fixture.nativeElement.querySelector('[id^="cngx-dialog-drag-hint"]');
    expect(hint?.textContent).toBe('Pfeiltasten bewegen den Dialog');
  });

  it('announces the overridden fallback when the error carries no message', async () => {
    TestBed.configureTestingModule({
      providers: [provideDialogConfig(withDialogLabels({ errorFallback: 'Ein Fehler ist aufgetreten' }))],
    });
    const fixture = host();
    fixture.componentInstance.error.set(true);
    fixture.detectChanges();
    await Promise.resolve();

    const live = fixture.nativeElement.querySelector('[aria-live]');
    expect(live?.textContent).toBe('Ein Fehler ist aufgetreten');
  });

  it('resolves plain features to the same bundle as the eager merge did', () => {
    TestBed.configureTestingModule({
      providers: [
        provideDialogConfig(
          withDialogLabels({ close: 'Schließen', dragHandle: 'A' }),
          withDialogLabels({ dragHandle: 'Verschieben' }),
        ),
      ],
    });
    expect(coerceSignal(TestBed.inject(CNGX_DIALOG_DEFAULTS).labels)()).toEqual({
      close: 'Schließen',
      errorFallback: 'An error occurred',
      dragHandle: 'Verschieben',
      dragHandleRoleDescription: 'draggable',
      dragInstructions: 'Use arrow keys to move the dialog; Shift for larger steps',
    });
  });

  describe('language switch', () => {
    const lang = signal<'en' | 'de'>('en');
    const DE = {
      close: 'Dialog schließen',
      errorFallback: 'Ein Fehler ist aufgetreten',
      dragHandle: 'Dialog verschieben',
      dragHandleRoleDescription: 'verschiebbar',
      dragInstructions: 'Pfeiltasten bewegen den Dialog',
    };

    beforeEach(() => {
      lang.set('en');
      TestBed.configureTestingModule({
        providers: [
          provideDialogConfig(withDialogLabels(computed(() => (lang() === 'de' ? DE : {})))),
        ],
      });
    });

    it('relabels the close button, the drag handle and its instruction in place', () => {
      const fixture = host();
      const root = fixture.nativeElement as HTMLElement;
      const button = root.querySelector('button') as HTMLElement;
      const handle = root.querySelector('.handle') as HTMLElement;
      const hint = root.querySelector('[id^="cngx-dialog-drag-hint"]') as HTMLElement;
      expect(button.getAttribute('aria-label')).toBe('Close dialog');
      expect(handle.getAttribute('aria-label')).toBe('Move dialog');

      lang.set('de');
      fixture.detectChanges();
      expect(button.getAttribute('aria-label')).toBe('Dialog schließen');
      expect(handle.getAttribute('aria-label')).toBe('Dialog verschieben');
      expect(handle.getAttribute('aria-roledescription')).toBe('verschiebbar');
      expect(hint.textContent).toBe('Pfeiltasten bewegen den Dialog');
      expect(root.querySelector('[id^="cngx-dialog-drag-hint"]')).toBe(hint);
    });

    it('does not re-announce on a language flip', async () => {
      const fixture = host();
      fixture.componentInstance.error.set(true);
      fixture.detectChanges();
      await Promise.resolve();
      const live = fixture.nativeElement.querySelector('[aria-live]') as HTMLElement;
      expect(live.textContent).toBe('An error occurred');
      live.textContent = '';

      lang.set('de');
      fixture.detectChanges();
      await Promise.resolve();
      expect(live.textContent).toBe('');

      fixture.componentInstance.error.set(false);
      fixture.detectChanges();
      fixture.componentInstance.error.set(true);
      fixture.detectChanges();
      await Promise.resolve();
      expect(live.textContent).toBe('Ein Fehler ist aufgetreten');
    });
  });
});

describe('CNGX_DIALOG_DEFAULTS language pack', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('derives the pre-section English labels from the English section', () => {
    expect(coerceSignal(TestBed.inject(CNGX_DIALOG_DEFAULTS).labels)()).toEqual({
      close: 'Close dialog',
      errorFallback: 'An error occurred',
      dragHandle: 'Move dialog',
      dragHandleRoleDescription: 'draggable',
      dragInstructions: 'Use arrow keys to move the dialog; Shift for larger steps',
    });
  });

  it('reads the dialog section of the active pack, English for what it leaves out', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off'))],
    });
    const labels = coerceSignal(TestBed.inject(CNGX_DIALOG_DEFAULTS).labels);
    expect(labels().close).toBe('Close dialog');
    pack.set({ locale: 'de', dialog: { close: 'Dialog schließen' } });
    expect(labels().close).toBe('Dialog schließen');
    expect(labels().dragHandle).toBe('Move dialog');
  });

  it('applies provideDialogConfigAt labels on top of the active pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCngxI18n(
          withPartialPack({
            locale: 'de',
            dialog: { close: 'Dialog schließen', dragHandle: 'Dialog verschieben' },
          }),
          withDocumentLanguage('off'),
        ),
        ...provideDialogConfigAt(withDialogLabels({ dragHandle: 'Fenster verschieben' })),
      ],
    });
    const labels = coerceSignal(TestBed.inject(CNGX_DIALOG_DEFAULTS).labels)();
    expect(labels.close).toBe('Dialog schließen');
    expect(labels.dragHandle).toBe('Fenster verschieben');
  });
});
