import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Radio indicator',
  navLabel: 'Radio indicator',
  navCategory: 'display',
  description:
    'Decorative dot-in-circle atom. Mirrors CngxCheckboxIndicator: aria-hidden, ' +
    'no outputs, full --cngx-radio-indicator-* theming. Used by the CngxSelect ' +
    '"radio" indicator variant; future single-value form atoms compose the ' +
    'same skin.',
  apiComponents: ['CngxRadioIndicator'],
  overview:
    '<p><code>cngx-radio-indicator</code> renders a circle with a centred dot when ' +
    '<code>checked</code> is true. Always <code>aria-hidden="true"</code> — the ' +
    'truth about selection lives on the parent row\'s <code>role="radio"</code> + ' +
    '<code>aria-checked</code>.</p>' +
    '<p>Override the dot via <code>[dotGlyph]</code> for design-system custom ' +
    'glyphs. Size scale matches <code>CngxCheckboxIndicator</code> so both atoms ' +
    'render at identical visual weight inside a select panel.</p>',
  moduleImports: ["import { CngxRadioIndicator } from '@cngx/common/display';"],
  sections: [
    {
      title: 'Default — unchecked vs checked',
      subtitle:
        'The circle frame is always rendered; the dot appears only when <code>[checked]="true"</code>.',
      imports: ['CngxRadioIndicator'],
      template: `
  <div class="row">
    <div class="cell">
      <cngx-radio-indicator />
      <span class="caption">unchecked</span>
    </div>
    <div class="cell">
      <cngx-radio-indicator [checked]="true" />
      <span class="caption">checked</span>
    </div>
  </div>`,
      css: `.row { display: flex; gap: 24px; align-items: center; color: var(--cngx-accent, #4a8cff); font-size: 1.5em; }
.cell { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.caption { font-size: 0.625em; color: var(--cngx-text-muted, #6b7280); }`,
    },
    {
      title: 'Sizes',
      subtitle:
        'Three presets driven by <code>--cngx-radio-indicator-size</code>. Defaults to <code>md</code> (1em).',
      imports: ['CngxRadioIndicator'],
      template: `
  <div class="row">
    <div class="cell">
      <cngx-radio-indicator [checked]="true" size="sm" />
      <span class="caption">sm — 0.875em</span>
    </div>
    <div class="cell">
      <cngx-radio-indicator [checked]="true" size="md" />
      <span class="caption">md — 1em</span>
    </div>
    <div class="cell">
      <cngx-radio-indicator [checked]="true" size="lg" />
      <span class="caption">lg — 1.25em</span>
    </div>
  </div>`,
      css: `.row { display: flex; gap: 24px; align-items: baseline; color: var(--cngx-accent, #4a8cff); font-size: 1.5em; }
.cell { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.caption { font-size: 0.625em; color: var(--cngx-text-muted, #6b7280); }`,
    },
    {
      title: 'Disabled',
      subtitle:
        'Cosmetic only — opacity is dimmed via <code>--cngx-radio-indicator-disabled-opacity</code>. ' +
        'The atom never intercepts events; the parent row owns the disabled hit-test.',
      imports: ['CngxRadioIndicator'],
      template: `
  <div class="row">
    <div class="cell">
      <cngx-radio-indicator [checked]="true" [disabled]="true" />
      <span class="caption">checked + disabled</span>
    </div>
    <div class="cell">
      <cngx-radio-indicator [disabled]="true" />
      <span class="caption">unchecked + disabled</span>
    </div>
  </div>`,
      css: `.row { display: flex; gap: 24px; align-items: center; color: var(--cngx-accent, #4a8cff); font-size: 1.5em; }
.cell { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.caption { font-size: 0.625em; color: var(--cngx-text-muted, #6b7280); opacity: 1; }`,
    },
    {
      title: 'Custom dotGlyph',
      subtitle:
        'Project a <code>TemplateRef&lt;void&gt;</code> via <code>[dotGlyph]</code> to replace the ' +
        'default dot with a brand glyph or SVG. Glyph still gates on <code>checked</code>.',
      imports: ['CngxRadioIndicator'],
      template: `
  <ng-template #starGlyph>
    <span aria-hidden="true" style="font-size:0.6em">★</span>
  </ng-template>
  <div class="row">
    <div class="cell">
      <cngx-radio-indicator [checked]="true" [dotGlyph]="starGlyph" />
      <span class="caption">custom — star</span>
    </div>
    <div class="cell">
      <cngx-radio-indicator [dotGlyph]="starGlyph" />
      <span class="caption">unchecked — glyph hidden</span>
    </div>
  </div>`,
      css: `.row { display: flex; gap: 24px; align-items: center; color: var(--cngx-accent, #4a8cff); font-size: 1.5em; }
.cell { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.caption { font-size: 0.625em; color: var(--cngx-text-muted, #6b7280); }`,
    },
    {
      title: 'Theming via CSS custom properties',
      subtitle:
        'Override <code>--cngx-radio-indicator-checked-color</code>, <code>--cngx-radio-indicator-border-width</code>, ' +
        '<code>--cngx-radio-indicator-dot-size</code>, and friends per consumer.',
      imports: ['CngxRadioIndicator'],
      template: `
  <div class="row themed">
    <cngx-radio-indicator [checked]="true" size="lg" />
    <cngx-radio-indicator [checked]="true" size="lg" class="brand-magenta" />
    <cngx-radio-indicator [checked]="true" size="lg" class="brand-emerald" />
  </div>`,
      css: `.row.themed {
  display: flex;
  gap: 16px;
  align-items: center;
  font-size: 1.75em;
  color: var(--cngx-accent, #4a8cff);
}
.brand-magenta {
  --cngx-radio-indicator-checked-color: #d6266a;
  --cngx-radio-indicator-border-width: 2px;
}
.brand-emerald {
  --cngx-radio-indicator-checked-color: #059669;
  --cngx-radio-indicator-dot-size: 0.6em;
}`,
    },
  ],
};
