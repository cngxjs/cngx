import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { CngxPopoverAction } from '@cngx/common/popover';
import { CngxStepperComplete, CngxStepperPresenter } from '@cngx/common/stepper';
import { CngxActionButton } from '@cngx/ui/action-button';
import { CngxToaster } from '@cngx/ui/feedback';

import { CngxAsyncClick, type AsyncAction } from './async-click.directive';

// Two runs that settle before change detection: every settle side effect
// must fire once per run, not once per flush (H1). The runs settle on
// microtasks only, so no scheduled change detection runs between them.

async function drainMicrotasks(): Promise<void> {
  for (let i = 0; i < 20; i++) {
    await Promise.resolve();
  }
}

function flush(fixture: ReturnType<typeof TestBed.createComponent>): void {
  fixture.detectChanges();
  TestBed.flushEffects();
}

/** Every non-empty text write into `region` (text node swaps and in-place updates). */
function recordWrites(region: Node): () => string[] {
  const writes: string[] = [];
  const observer = new MutationObserver(() => undefined);
  observer.observe(region, { childList: true, characterData: true, subtree: true });
  return () => {
    for (const record of observer.takeRecords()) {
      const text =
        record.type === 'characterData'
          ? ((record.target as Text).data ?? '')
          : Array.from(record.addedNodes, (n) => n.textContent ?? '').join('');
      if (text.trim()) {
        writes.push(text.trim());
      }
    }
    return writes;
  };
}

@Component({
  template: `<button [cngxAsyncClick]="action">Go</button>`,
  imports: [CngxAsyncClick],
})
class PlainHost {
  readonly action: AsyncAction = () => Promise.reject(new Error('nope'));
}

@Component({
  template: `<button cngxActionButton [action]="action" toastError="Save failed">Save</button>`,
  imports: [CngxActionButton],
})
class ActionButtonHost {
  readonly action = (): Promise<void> => Promise.reject(new Error('nope'));
}

@Component({
  imports: [CngxStepperComplete],
  hostDirectives: [CngxStepperPresenter],
  template: `<button [cngxStepperComplete]="action" (completed)="completedCount.set(completedCount() + 1)">
    Finish
  </button>`,
})
class StepperCompleteHost {
  readonly completedCount = signal(0);
  readonly action = (): Promise<void> => Promise.resolve();
}

@Component({
  template: `<cngx-popover-action role="confirm" [action]="action">Save</cngx-popover-action>`,
  imports: [CngxPopoverAction],
})
class PopoverActionHost {
  readonly action: AsyncAction = () => Promise.reject(new Error('nope'));
}

async function clickTwiceWithoutChangeDetection(button: HTMLElement): Promise<void> {
  button.click();
  await drainMicrotasks();
  button.click();
  await drainMicrotasks();
}

describe('cngxAsyncClick settle side effects across two runs without change detection', () => {
  it('writes the plain directive live region once per failed run', async () => {
    const fixture = TestBed.createComponent(PlainHost);
    flush(fixture);
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const region = button.nextElementSibling as HTMLElement;
    const writes = recordWrites(region);

    await clickTwiceWithoutChangeDetection(button);
    flush(fixture);

    expect(writes()).toEqual(['Action failed', 'Action failed']);
  });

  it('shows the action button error toast once per failed run', async () => {
    const show = vi.fn();
    TestBed.configureTestingModule({ providers: [{ provide: CngxToaster, useValue: { show } }] });
    const fixture = TestBed.createComponent(ActionButtonHost);
    flush(fixture);
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    await clickTwiceWithoutChangeDetection(button);
    flush(fixture);

    expect(show).toHaveBeenCalledTimes(2);
  });

  it('emits stepper (completed) once per successful run', async () => {
    const fixture = TestBed.createComponent(StepperCompleteHost);
    flush(fixture);
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    await clickTwiceWithoutChangeDetection(button);
    flush(fixture);

    expect(fixture.componentInstance.completedCount()).toBe(2);
  });

  it('writes the popover action region once per failed run', async () => {
    const fixture = TestBed.createComponent(PopoverActionHost);
    flush(fixture);
    const root = fixture.nativeElement as HTMLElement;
    const button = root.querySelector('button') as HTMLButtonElement;
    const region = root.querySelector('.cngx-popover-action__sr-only') as HTMLElement;
    const writes = recordWrites(region);

    await clickTwiceWithoutChangeDetection(button);
    flush(fixture);

    expect(writes()).toEqual(['Action failed', 'Action failed']);
  });
});
