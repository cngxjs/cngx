import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Form Fields — Custom Focus Ring',
  subtitle: 'Apply <code>[cngxFocusVisible]</code> to form elements to show a focus ring only for keyboard users. Mouse-clicking an input focuses it but does not trigger the ring — reducing visual noise for pointer users.',
  description: 'Tracks keyboard-initiated focus to distinguish it from pointer focus. Adds the cngx-focus-visible CSS class only when focus was triggered by keyboard.',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxFocusVisible',
  ],
  imports: ['CngxFocusVisible'],
  setup: `protected name = signal('');
  protected email = signal('');`,
  template: `
  <div style="display: flex; flex-direction: column; gap: 12px; max-width: 320px;">
    <div>
      <label style="display: block; font-size: 0.8125rem; font-weight: 500; margin-bottom: 4px;">Name</label>
      <input
        cngxFocusVisible
        #fvName="cngxFocusVisible"
        [value]="name()"
        (input)="name.set($any($event.target).value)"
        placeholder="Jane Doe"
        style="
          width: 100%;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid var(--cngx-color-border, #ddd);
          outline: none;
          font-size: 0.875rem;
          transition: box-shadow 0.15s;
        "
        [style.box-shadow]="fvName.focusVisible() ? '0 0 0 2px var(--cngx-accent, #f5a623)' : 'none'"
      />
    </div>

    <div>
      <label style="display: block; font-size: 0.8125rem; font-weight: 500; margin-bottom: 4px;">Email</label>
      <input
        cngxFocusVisible
        #fvEmail="cngxFocusVisible"
        [value]="email()"
        (input)="email.set($any($event.target).value)"
        placeholder="jane@example.com"
        type="email"
        style="
          width: 100%;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid var(--cngx-color-border, #ddd);
          outline: none;
          font-size: 0.875rem;
          transition: box-shadow 0.15s;
        "
        [style.box-shadow]="fvEmail.focusVisible() ? '0 0 0 2px var(--cngx-accent, #f5a623)' : 'none'"
      />
    </div>

    <button
      cngxFocusVisible
      #fvSubmit="cngxFocusVisible"
      class="sort-btn"
      style="outline: none; align-self: flex-start;"
      [style.box-shadow]="fvSubmit.focusVisible() ? '0 0 0 2px var(--cngx-accent, #f5a623)' : 'none'"
    >
      Submit
    </button>
  </div>

  <div class="event-grid" style="margin-top: 12px">
    <div class="event-row">
      <span class="event-label">Name field</span>
      <span class="event-value">{{ fvName.focusVisible() ? 'keyboard focus' : 'no keyboard focus' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Email field</span>
      <span class="event-value">{{ fvEmail.focusVisible() ? 'keyboard focus' : 'no keyboard focus' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Submit button</span>
      <span class="event-value">{{ fvSubmit.focusVisible() ? 'keyboard focus' : 'no keyboard focus' }}</span>
    </div>
  </div>`,
};
