import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMultiSelect: multi typeahead while closed',
  subtitle:
    'Focus the closed trigger and type a letter: the first matching option toggles without opening the panel, the way a native <code>&lt;select multiple&gt;</code> answers typing. Type the same letter again to toggle that option off.',
  description:
    'On by default; <code>provideSelectConfig(withTypeaheadWhileClosed(false))</code> turns it off app-wide, <code>provideSelectConfigAt</code> for one subtree. Every keystroke is its own toggle: the multi-select clears the search buffer after each pick, so a repeated letter does not build a longer term the way the single select does. Modifier combos pass through untouched, and an open panel hands typing to the listbox.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern'],
  framework: 'programmatic',
  apiComponents: ['CngxMultiSelect'],
  moduleImports: [
    "import { CngxMultiSelect, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['CngxMultiSelect'],
  setup: `protected readonly fruit: CngxSelectOptionDef<string>[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'apricot', label: 'Apricot' },
  { value: 'banana', label: 'Banana' },
  { value: 'blueberry', label: 'Blueberry' },
  { value: 'cherry', label: 'Cherry' },
];
protected readonly basket = signal<string[]>([]);`,
  template: `<div class="kbd-hint">
  <strong>Try it:</strong>
  <span><kbd>Tab</kbd> to the trigger</span>
  <span>Type <kbd>b</kbd> to add Banana, <kbd>b</kbd> again to remove it</span>
</div>
<cngx-multi-select
  [label]="'Basket'"
  [options]="fruit"
  [(values)]="basket"
  placeholder="Type to pick…"
/>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ basket().join(', ') || '-' }}</span></div>
  </div>`,
};
