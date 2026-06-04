import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxInputMask: custom tokens and transform',
  subtitle: 'Define custom token characters via <code>[customTokens]</code>. Use <code>[transform]</code> for global character transforms.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: [
    'CngxInputMask',
  ],
  moduleImports: [
    'import { CngxInputMask } from \'@cngx/forms/input\';',
  ],
  imports: ['CngxInputMask'],
  setup: `protected readonly hexTokens = { H: { pattern: /[0-9a-fA-F]/, transform: (c: string) => c.toUpperCase() } };
  protected readonly upper = (c: string) => c.toUpperCase();`,
  template: `  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label">Hex Color (#HHHHHH)</label>
      <input [cngxInputMask]="'\\\\#HHHHHH'" [customTokens]="hexTokens"
        #hexMask="cngxInputMask" class="demo-input" />
      
    </div>
    <div class="demo-field">
      <label class="demo-label">Uppercase Letters Only</label>
      <input cngxInputMask="AAAA-AAAA" [transform]="upper" #upMask="cngxInputMask" class="demo-input" />
      
    </div>
  </div>`,
  templateChrome: `<div class="status-row">
        <span class="status-badge"
          [style.background-color]="hexMask.isComplete() ? hexMask.maskedValue() : 'transparent'"
          [style.color]="hexMask.isComplete() ? '#fff' : 'inherit'"
          [style.padding]="'2px 8px'"
        >{{ hexMask.maskedValue() }}</span>
      </div>
<div class="status-row">
        <span class="status-badge">{{ upMask.rawValue() }}</span>
      </div>`,
};
