import { describe, it, expect, beforeEach } from 'vitest';
import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CngxDialog } from '../dialog/dialog.directive';
import { CngxDialogClose } from '../dialog/dialog-close.directive';
import { CngxDialogTitle } from '../dialog/dialog-title.directive';
import { CngxDialogDraggable } from '../draggable/dialog-draggable.directive';
import {
  CNGX_DIALOG_DEFAULTS,
  injectDialogConfig,
  provideDialogConfig,
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
    expect(TestBed.inject(CNGX_DIALOG_DEFAULTS).labels).toEqual({
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
    const { labels } = TestBed.runInInjectionContext(() => injectDialogConfig());
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
    const { labels } = TestBed.runInInjectionContext(() => injectDialogConfig());
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
});
