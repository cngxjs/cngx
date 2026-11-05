import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTypeahead: input mode and enter-key hint via config',
  subtitle:
    "<code>provideSelectConfigAt(withInputMode('search'), withEnterKeyHint('go'))</code> sets the soft-keyboard hints for every input-trigger select in the subtree. The typeahead's <code>&lt;input role=\"combobox\"&gt;</code> renders <code>inputmode</code> and <code>enterkeyhint</code> from the config, so a touch keyboard shows the search layout and a Go return key. A per-instance input still wins.",
  description:
    'The hints steer the on-screen keyboard on touch devices; on a desktop they only set the two attributes, mirrored below from the live input.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  framework: 'template-only',
  apiComponents: ['CngxTypeahead'],
  moduleImports: [
    "import { CngxTypeahead, provideSelectConfigAt, withEnterKeyHint, withInputMode, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['CngxTypeahead'],
  viewProviders: ["...provideSelectConfigAt(withInputMode('search'), withEnterKeyHint('go'))"],
  setup: `protected readonly fruits: CngxSelectOptionDef<string>[] = [
    { value: 'apricot', label: 'Apricot' },
    { value: 'blackberry', label: 'Blackberry' },
    { value: 'blueberry', label: 'Blueberry' },
    { value: 'cranberry', label: 'Cranberry' },
  ];
  protected readonly fruit = signal<string | undefined>(undefined);`,
  setupChrome: `private readonly hostEl: ElementRef<HTMLElement> = inject(ElementRef);
  protected readonly inputAttrs = signal('-');
  private readonly readAttrs = afterNextRender(() => {
    const input = this.hostEl.nativeElement.querySelector('input');
    const mode = input?.getAttribute('inputmode') ?? '-';
    const hint = input?.getAttribute('enterkeyhint') ?? '-';
    this.inputAttrs.set('inputmode=' + mode + ', enterkeyhint=' + hint);
  });`,
  template: `<cngx-typeahead
  [label]="'Fruit'"
  [options]="fruits"
  [(value)]="fruit"
  placeholder="Search…"
/>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Input attributes</span><span class="event-value">{{ inputAttrs() }}</span></div>
  </div>`,
};
