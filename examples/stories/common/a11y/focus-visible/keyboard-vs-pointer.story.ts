import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFocusVisible — Keyboard vs Pointer',
  subtitle: '<code>[cngxFocusVisible]</code> adds the <code>cngx-focus-visible</code> class when the element receives keyboard focus. Mouse/touch focus does not add the class. Unlike native <code>:focus-visible</code>, the signal is available in TypeScript for conditional logic beyond CSS.',
  description: 'Tracks keyboard-initiated focus to distinguish it from pointer focus. Adds the cngx-focus-visible CSS class only when focus was triggered by keyboard.',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxFocusVisible',
  ],
  imports: ['CngxFocusVisible'],
  template: `  <p style="margin-bottom: 12px; font-size: 0.875rem; color: var(--cngx-text-secondary, #666);">
    Tab into the buttons below using the keyboard. Then click with the mouse.
    Only keyboard focus shows the custom ring.
  </p>`,
  templateChrome: `<div class="button-row">
    <button
      cngxFocusVisible
      #fv1="cngxFocusVisible"
      class="sort-btn"
      style="outline: none; position: relative;"
      [style.box-shadow]="fv1.focusVisible() ? '0 0 0 3px var(--cngx-accent, #f5a623)' : 'none'"
    >
      Button A
      @if (fv1.focusVisible()) {
        <span class="chip chip--active" style="margin-left: 4px; font-size: 0.7rem;">kbd</span>
      }
    </button>

    <button
      cngxFocusVisible
      #fv2="cngxFocusVisible"
      class="sort-btn"
      style="outline: none; position: relative;"
      [style.box-shadow]="fv2.focusVisible() ? '0 0 0 3px var(--cngx-accent, #f5a623)' : 'none'"
    >
      Button B
      @if (fv2.focusVisible()) {
        <span class="chip chip--active" style="margin-left: 4px; font-size: 0.7rem;">kbd</span>
      }
    </button>
  </div>
<div class="event-grid" style="margin-top: 12px">
    <div class="event-row">
      <span class="event-label">Button A focusVisible</span>
      <span class="event-value">{{ fv1.focusVisible() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Button B focusVisible</span>
      <span class="event-value">{{ fv2.focusVisible() }}</span>
    </div>
  </div>`,
};
