import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxReducedMotion: Animation toggle',
  subtitle:
    '<code>[cngxReducedMotion]</code> reflects <code>prefers-reduced-motion: reduce</code> as a host CSS class and as a signal. Pure-CSS demos hang their <code>animation: none</code> override off the class; this story shows that path.',
  description:
    'Two looping animations on the host. The directive toggles a <code>.cngx-reduced-motion</code> class on the host whenever the OS preference flips. A single CSS rule under that class disables the animations, so the artifact template carries no signal logic. Toggle "Reduce motion" in your OS to see the spinner and progress bar freeze without a page reload.',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxReducedMotion'],
  imports: ['CngxReducedMotion'],
  references: [
    {
      label: 'WCAG 2.1 SC 2.3.3 Animation from Interactions',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html',
    },
    {
      label: 'CSS Media Queries Level 5: prefers-reduced-motion',
      href: 'https://drafts.csswg.org/mediaqueries-5/#prefers-reduced-motion',
    },
  ],
  template: `  <div cngxReducedMotion #rm="cngxReducedMotion" style="display:flex;gap:24px;align-items:center">
    <div class="cngx-ex-demo-spinner" aria-hidden="true"></div>
    <div class="cngx-ex-demo-progress" aria-hidden="true">
      <div class="cngx-ex-demo-progress-bar"></div>
    </div>
  </div>`,
  templateChromeBefore: `<details class="cngx-ex-help-disclosure">
    <summary>How to toggle reduced motion in your OS</summary>
    <div class="cngx-ex-help-disclosure-panel">
      <ul>
        <li><strong>macOS:</strong> System Settings &rsaquo; Accessibility &rsaquo; Display &rsaquo; Reduce motion</li>
        <li><strong>Windows 11:</strong> Settings &rsaquo; Accessibility &rsaquo; Visual effects &rsaquo; Animation effects</li>
        <li><strong>Windows 10:</strong> Settings &rsaquo; Ease of Access &rsaquo; Display &rsaquo; Show animations in Windows</li>
        <li><strong>GNOME:</strong> Settings &rsaquo; Accessibility &rsaquo; Enable animations</li>
      </ul>
      <p style="margin:8px 0 0">The animations below freeze the moment the preference flips, no reload needed.</p>
    </div>
  </details>`,
  templateChrome: `<div class="event-grid" style="margin-top:16px">
    <div class="event-row">
      <span class="event-label">prefersReducedMotion</span>
      <span class="event-value">{{ rm.prefersReducedMotion() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Host class</span>
      <span class="event-value">{{ rm.prefersReducedMotion() ? 'cngx-reduced-motion' : '(none)' }}</span>
    </div>
  </div>`,
};
