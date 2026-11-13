import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';

import { CngxButtonBrain, provideButtonHost } from '@cngx/common/button';
import { CngxMenuTrigger } from '@cngx/common/interactive';
import { CngxSplitCaret } from '@cngx/common/menu-button';
import { CngxPopoverTrigger } from '@cngx/common/popover';

/**
 * Fixture for `custom-caret-host.story.ts`: an app-written caret for a
 * `cngxSplitButton`. `CngxButtonBrain` owns the axes, `aria-disabled` and the
 * activation guard; `CngxSplitCaret` makes the host the split's caret, so it
 * refuses with the main action and reads the cause through
 * `aria-describedby`. The host keeps its glyph, the name and busy note
 * spans the directive supplies, and a click toggle that never opens the
 * menu while the button is blocked.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute selector by design (sits on the native button)
  selector: 'button[appOutlineCaret]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: CngxButtonBrain,
      inputs: ['variant: appOutlineCaret', 'tone', 'disabled', 'disabledReason'],
    },
    { directive: CngxMenuTrigger, inputs: ['cngxMenuTrigger: menu', 'popover'] },
    { directive: CngxPopoverTrigger, inputs: ['cngxPopoverTrigger: popover'] },
    CngxSplitCaret,
  ],
  providers: [provideButtonHost('appOutlineCaret', { defaultVariant: 'outline', iconOnly: true })],
  host: {
    class: 'app-outline-caret',
    '(click)': 'handleClick()',
  },
  template: `
    <svg class="app-outline-caret__glyph" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 10l5 5 5-5z" fill="currentColor" />
    </svg>
    @if (caret.isCaret()) {
      <span class="cngx-sr-only">{{ caret.label() }}</span>
      <span [id]="caret.busyNoteId" hidden>{{ caret.busyNote() }}</span>
    }
    @if (brain.disabledReason(); as reason) {
      <span [id]="brain.reasonId" hidden>{{ reason }}</span>
    }
  `,
  styles: `
    .app-outline-caret {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-inline-size: var(--cngx-target-min, 32px);
      min-block-size: var(--cngx-target-min, 32px);
      padding: 0;
      border: 1px solid var(--cngx-color-border, #d1d5db);
      border-start-end-radius: var(--cngx-radius-md, 6px);
      border-end-end-radius: var(--cngx-radius-md, 6px);
      background: var(--cngx-color-surface, #fff);
      color: var(--cngx-color-text, #1f2937);
      cursor: pointer;
    }
    .app-outline-caret[aria-disabled='true'] {
      color: var(--cngx-color-text-muted, #6b7280);
      cursor: not-allowed;
    }
    .app-outline-caret__glyph {
      inline-size: var(--app-outline-caret-glyph, 1.25em);
      block-size: var(--app-outline-caret-glyph, 1.25em);
    }
    @media (forced-colors: active) {
      .app-outline-caret {
        border-color: ButtonText;
      }
      .app-outline-caret[aria-disabled='true'] {
        border-color: GrayText;
        color: GrayText;
      }
    }
  `,
})
export class OutlineCaret {
  protected readonly caret = inject(CngxSplitCaret);
  protected readonly brain = inject(CngxButtonBrain);
  private readonly menu = inject(CngxMenuTrigger);
  private readonly popover = inject(CngxPopoverTrigger);

  // A blocked caret never opens its menu; an open one still closes.
  protected handleClick(): void {
    if (this.brain.blocked() && !this.menu.isOpen()) {
      return;
    }
    this.popover.popoverRef().toggle();
  }
}
