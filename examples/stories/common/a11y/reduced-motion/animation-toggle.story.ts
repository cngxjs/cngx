import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxReducedMotion — Animation Toggle',
  subtitle: '<code>[cngxReducedMotion]</code> reflects <code>prefers-reduced-motion: reduce</code> as a signal. Use it in TypeScript to conditionally skip animations, transitions, or auto-playing media — not just CSS. The <code>cngx-reduced-motion</code> class on the host element enables CSS-only overrides too.',
  description: 'Reads the prefers-reduced-motion media query and adds the cngx-reduced-motion CSS class when the user prefers reduced motion.',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxReducedMotion',
  ],
  imports: ['CngxReducedMotion'],
  template: `  <div
    cngxReducedMotion
    #rm="cngxReducedMotion"
  >
    <div style="display: flex; gap: 24px; align-items: center;">
      <div
        style="
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--cngx-accent, #f5a623);
          flex-shrink: 0;
        "
        [style.animation]="rm.prefersReducedMotion() ? 'none' : 'cngx-demo-spin 2s linear infinite'"
      ></div>

      <div
        style="
          width: 120px;
          height: 8px;
          border-radius: 4px;
          background: var(--cngx-surface-alt, #f0f0f0);
          overflow: hidden;
        "
      >
        <div
          style="
            width: 40%;
            height: 100%;
            border-radius: 4px;
            background: var(--cngx-accent, #f5a623);
          "
          [style.animation]="rm.prefersReducedMotion() ? 'none' : 'cngx-demo-progress 1.5s ease-in-out infinite'"
        ></div>
      </div>
    </div>

    <p style="margin-top: 12px; font-size: 0.8125rem; color: var(--cngx-text-secondary, #666);">
      @if (rm.prefersReducedMotion()) {
        Reduced motion is active — animations disabled. Turn off "Reduce motion"
        in your OS accessibility settings to see them.
      } @else {
        Animations are running. Enable "Reduce motion" in your OS to test.
        On macOS: System Settings > Accessibility > Display > Reduce motion.
      }
    </p>
  </div>

  <style>
    @keyframes cngx-demo-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes cngx-demo-progress {
      0%, 100% { transform: translateX(-100%); }
      50% { transform: translateX(200%); }
    }
    @keyframes cngx-demo-slide-in {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  </style>`,
  templateChrome: `<div class="event-grid" style="margin-top: 16px">
      <div class="event-row">
        <span class="event-label">prefersReducedMotion</span>
        <span class="event-value">{{ rm.prefersReducedMotion() }}</span>
      </div>
      <div class="event-row">
        <span class="event-label">CSS class</span>
        <span class="event-value">{{ rm.prefersReducedMotion() ? 'cngx-reduced-motion' : '(none)' }}</span>
      </div>
    </div>`,
};
