import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFocusVisible: Keyboard vs pointer',
  subtitle:
    '<code>[cngxFocusVisible]</code> adds the <code>cngx-focus-visible</code> class only when the element receives keyboard focus. Mouse / touch focus does not. Unlike native <code>:focus-visible</code>, the signal is also exposed in TypeScript for any logic CSS cannot express.',
  description:
    'Side-by-side buttons isolate the directive\'s decision rule: Tab through them and the keyboard-ring paints, click them with a pointer and it stays off. Each button also exposes a "kbd" indicator chip via the signal, so the reader can confirm the same state is available programmatically, not just as a class hook.',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxFocusVisible'],
  imports: ['CngxFocusVisible'],
  references: [
    {
      label: 'WCAG 2.1 SC 2.4.7 Focus Visible',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html',
    },
    {
      label: 'CSS Selectors Level 4: :focus-visible',
      href: 'https://www.w3.org/TR/selectors-4/#the-focus-visible-pseudo',
    },
  ],
  template: `  <div class="button-row">
    <button type="button"
            id="cngx-focus-visible-button-a"
            cngxFocusVisible
            #fv1="cngxFocusVisible"
            class="chip cngx-ex-keyboard-ring">
      Button A
      @if (fv1.focusVisible()) {
        <span style="margin-left:6px;font-size:0.7rem">kbd</span>
      }
    </button>

    <button type="button"
            id="cngx-focus-visible-button-b"
            cngxFocusVisible
            #fv2="cngxFocusVisible"
            class="chip cngx-ex-keyboard-ring">
      Button B
      @if (fv2.focusVisible()) {
        <span style="margin-left:6px;font-size:0.7rem">kbd</span>
      }
    </button>
  </div>`,
  templateChromeBefore: `<p>Tab into the buttons below using the keyboard, then click them with the mouse. Only keyboard focus paints the custom ring and shows the <em>kbd</em> chip.</p>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
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
