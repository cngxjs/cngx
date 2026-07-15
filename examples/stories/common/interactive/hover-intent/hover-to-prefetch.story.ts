import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxHoverIntent: Hover to prefetch',
  subtitle:
    'Bind <code>(intentChange)</code> to act on the debounced edge rather than reading <code>active()</code>. The prefetch fires once, only after the pointer has confirmed intent - never on a stray <code>mouseenter</code> during a sweep across the card.',
  description:
    'Rest the pointer on the card for ~200ms (or Tab to it) and the prefetch runs once. Sweep across without pausing and it never fires. The (intentChange) output emits true on settle-in; $event && prefetch() gates the call on the rising edge. A focus path (focusin) covers keyboard users, so prefetch is never mouse-only.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'integration'],
  apiComponents: ['CngxHoverIntent'],
  references: [
    { label: 'WCAG 2.1.1 Keyboard', href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html' },
  ],
  moduleImports: [
    "import { signal } from '@angular/core';",
    "import { CngxHoverIntent } from '@cngx/common/interactive';",
    "import { CngxTag } from '@cngx/common/display';",
  ],
  imports: ['CngxHoverIntent', 'CngxTag'],
  setup: `protected readonly prefetched = signal(false);
  protected prefetch(): void {
    this.prefetched.set(true);
  }`,
  template: `
  <div
    cngxHoverIntent
    [enterDelay]="200"
    (intentChange)="$event && prefetch()"
    tabindex="0"
    (focusin)="prefetch()"
    style="display:inline-block; min-width:16rem; padding:1rem 1.25rem; border:1px solid var(--cngx-border, #d4d4d8); border-radius:0.5rem"
  >
    <strong>Analytics report</strong>
    <p style="margin:0.5rem 0 0">
      @if (prefetched()) {
        Ready - data prefetched on hover intent.
      } @else {
        Rest here ~200ms (or Tab to it) to prefetch.
      }
    </p>
  </div>`,
  templateChrome: `
  <div class="button-row" style="margin-top:0.75rem">
    <cngx-tag [color]="prefetched() ? 'success' : 'neutral'">prefetched: {{ prefetched() }}</cngx-tag>
    <button type="button" (click)="prefetched.set(false)">Reset</button>
  </div>`,
};
