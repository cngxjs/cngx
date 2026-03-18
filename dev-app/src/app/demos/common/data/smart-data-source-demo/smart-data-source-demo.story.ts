import type { DemoSpec } from '../../../../../dev-tools/demo-spec';

// NOTE: This demo uses a nested sub-component (SmartDsExampleComponent) that
// carries CngxSort + CngxFilter as hostDirectives so injectSmartDataSource()
// can discover them via DI. The sub-component pattern cannot be expressed in
// the story format today — this story is a stub.
// Run `npm run demo:enrich -- --component CngxSmartDataSource` to generate a
// full story once the nested-component pattern is supported.

export const STORY: DemoSpec = {
  title: 'SmartDataSource',
  sections: [
    {
      title: 'CngxSmartDataSource — Auto-Wired',
      subtitle: '<code>injectSmartDataSource()</code> auto-discovers <code>[cngxSort]</code> and <code>[cngxFilter]</code> via <code>inject()</code> when they are applied as <code>hostDirectives</code> on the host element. No explicit wiring needed.',
      // TODO: Replace with working template once nested-component pattern is supported
      template: `<p>See source: <code>smart-data-source-demo.component.ts</code></p>`,
    },
  ],
};
