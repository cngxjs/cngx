import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Default glyphs (internal)',
  subtitle: 'Every glyph cngx draws itself, rendered from <code>@cngx/utils</code> path data by <code>svg[cngxIconSvg]</code>. Internal sign-off surface, not a public icon set.',
  description: 'Each row shows the glyph standalone at the running text size (1em) and projected into <code>&lt;cngx-icon&gt;</code> at every size preset (<code>xs</code> to <code>xl</code>), which then owns the box. Fill glyphs paint their area in <code>currentColor</code>; stroke glyphs paint only the outline with round caps. The micro column shows the 12-grid drawing in a 12px box once an icon carries one, and stays empty until then. Check the shapes in light, dark and forced colors. The small-size sheet below is the 1x sign-off surface for the 12-grid micro tier: every glyph at 10 to 16px as its 24-grid path and as two story-local draft fills, A with 1-unit lines and B with one dominant element at 2 units (for the caret, A is a pixel staircase and B a smooth triangle). Open it at browser zoom 100% on a devicePixelRatio 1 screen.',
  audience: ['design'],
  focus: ['visual-variants'],
  apiComponents: ['CngxIconSvg'],
  moduleImports: [
    'import { CngxCheckboxIndicator, CngxIcon, CngxIconSvg, CngxRadioIndicator, CngxStatus } from \'@cngx/common/display\';',
    'import { CNGX_ICON_ALERT, CNGX_ICON_BAN, CNGX_ICON_CARET_DOWN, CNGX_ICON_CHECK, CNGX_ICON_CHEVRONS_LEFT, CNGX_ICON_CHEVRONS_RIGHT, CNGX_ICON_CHEVRON_LEFT, CNGX_ICON_CHEVRON_RIGHT, CNGX_ICON_DOT, CNGX_ICON_GRIP_VERTICAL, CNGX_ICON_MINUS, CNGX_ICON_MORE_HORIZONTAL, CNGX_ICON_MORE_VERTICAL, CNGX_ICON_PLUS, CNGX_ICON_TRIANGLE_DOWN, CNGX_ICON_TRIANGLE_UP, CNGX_ICON_X, CNGX_ICON_CHEVRON_DOWN, CNGX_ICON_TRASH, CNGX_ICON_DOWNLOAD, CNGX_ICON_X_CIRCLE, CNGX_ICON_CUT, CNGX_ICON_COPY, CNGX_ICON_CLIPBOARD, CNGX_ICON_SEARCH, CNGX_ICON_ZOOM_IN, CNGX_ICON_ZOOM_OUT, CNGX_ICON_MAXIMIZE, CNGX_ICON_UNDO, CNGX_ICON_REDO, CNGX_ICON_PENCIL, CNGX_ICON_BELL, CNGX_ICON_INFO, CNGX_ICON_EXCLAMATION, CNGX_ICON_EXCLAMATION_SOLID, CNGX_ICON_QUESTION, CNGX_ICON_INFO_CIRCLE, CNGX_ICON_CHECK_CIRCLE, CNGX_ICON_ARCHIVE, CNGX_ICON_VOLUME, CNGX_ICON_STOP, type CngxIconData } from \'@cngx/utils\';',
  ],
  imports: ['CngxCheckboxIndicator', 'CngxIcon', 'CngxIconSvg', 'CngxRadioIndicator', 'CngxStatus'],
  setup: `
  protected readonly sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

  protected readonly icons: readonly { name: string; icon: CngxIconData }[] = [
    { name: 'CNGX_ICON_X', icon: CNGX_ICON_X },
    { name: 'CNGX_ICON_PLUS', icon: CNGX_ICON_PLUS },
    { name: 'CNGX_ICON_MINUS', icon: CNGX_ICON_MINUS },
    { name: 'CNGX_ICON_CARET_DOWN', icon: CNGX_ICON_CARET_DOWN },
    { name: 'CNGX_ICON_CHEVRON_LEFT', icon: CNGX_ICON_CHEVRON_LEFT },
    { name: 'CNGX_ICON_CHEVRON_RIGHT', icon: CNGX_ICON_CHEVRON_RIGHT },
    { name: 'CNGX_ICON_CHEVRONS_LEFT', icon: CNGX_ICON_CHEVRONS_LEFT },
    { name: 'CNGX_ICON_CHEVRONS_RIGHT', icon: CNGX_ICON_CHEVRONS_RIGHT },
    { name: 'CNGX_ICON_MORE_HORIZONTAL', icon: CNGX_ICON_MORE_HORIZONTAL },
    { name: 'CNGX_ICON_MORE_VERTICAL', icon: CNGX_ICON_MORE_VERTICAL },
    { name: 'CNGX_ICON_CHECK', icon: CNGX_ICON_CHECK },
    { name: 'CNGX_ICON_DOT', icon: CNGX_ICON_DOT },
    { name: 'CNGX_ICON_ALERT', icon: CNGX_ICON_ALERT },
    { name: 'CNGX_ICON_BAN', icon: CNGX_ICON_BAN },
    { name: 'CNGX_ICON_GRIP_VERTICAL', icon: CNGX_ICON_GRIP_VERTICAL },
    { name: 'CNGX_ICON_TRIANGLE_UP', icon: CNGX_ICON_TRIANGLE_UP },
    { name: 'CNGX_ICON_TRIANGLE_DOWN', icon: CNGX_ICON_TRIANGLE_DOWN },
    { name: 'CNGX_ICON_CHEVRON_DOWN', icon: CNGX_ICON_CHEVRON_DOWN },
    { name: 'CNGX_ICON_TRASH', icon: CNGX_ICON_TRASH },
    { name: 'CNGX_ICON_DOWNLOAD', icon: CNGX_ICON_DOWNLOAD },
    { name: 'CNGX_ICON_X_CIRCLE', icon: CNGX_ICON_X_CIRCLE },
    { name: 'CNGX_ICON_CUT', icon: CNGX_ICON_CUT },
    { name: 'CNGX_ICON_COPY', icon: CNGX_ICON_COPY },
    { name: 'CNGX_ICON_CLIPBOARD', icon: CNGX_ICON_CLIPBOARD },
    { name: 'CNGX_ICON_SEARCH', icon: CNGX_ICON_SEARCH },
    { name: 'CNGX_ICON_ZOOM_IN', icon: CNGX_ICON_ZOOM_IN },
    { name: 'CNGX_ICON_ZOOM_OUT', icon: CNGX_ICON_ZOOM_OUT },
    { name: 'CNGX_ICON_MAXIMIZE', icon: CNGX_ICON_MAXIMIZE },
    { name: 'CNGX_ICON_UNDO', icon: CNGX_ICON_UNDO },
    { name: 'CNGX_ICON_REDO', icon: CNGX_ICON_REDO },
    { name: 'CNGX_ICON_PENCIL', icon: CNGX_ICON_PENCIL },
    { name: 'CNGX_ICON_BELL', icon: CNGX_ICON_BELL },
    { name: 'CNGX_ICON_INFO', icon: CNGX_ICON_INFO },
    { name: 'CNGX_ICON_EXCLAMATION', icon: CNGX_ICON_EXCLAMATION },
    { name: 'CNGX_ICON_EXCLAMATION_SOLID', icon: CNGX_ICON_EXCLAMATION_SOLID },
    { name: 'CNGX_ICON_QUESTION', icon: CNGX_ICON_QUESTION },
    { name: 'CNGX_ICON_INFO_CIRCLE', icon: CNGX_ICON_INFO_CIRCLE },
    { name: 'CNGX_ICON_CHECK_CIRCLE', icon: CNGX_ICON_CHECK_CIRCLE },
    { name: 'CNGX_ICON_ARCHIVE', icon: CNGX_ICON_ARCHIVE },
    { name: 'CNGX_ICON_VOLUME', icon: CNGX_ICON_VOLUME },
    { name: 'CNGX_ICON_STOP', icon: CNGX_ICON_STOP },
  ] as const;

  // A resolution query matches only the current ratio, so it fires once when
  // the window moves to a screen with another devicePixelRatio; re-arm it there.
  protected readonly dpr = signal(devicePixelRatio);

  constructor() {
    let query: MediaQueryList | null = null;
    const onChange = () => {
      this.dpr.set(devicePixelRatio);
      arm();
    };
    const arm = () => {
      query?.removeEventListener('change', onChange);
      query = matchMedia('(resolution: ' + devicePixelRatio + 'dppx)');
      query.addEventListener('change', onChange);
    };
    arm();
    inject(DestroyRef).onDestroy(() => query?.removeEventListener('change', onChange));
  }

  protected readonly sheetSizes = [10, 11, 12, 13, 14, 16] as const;

  // Story-local micro drafts on a 12-unit grid: closed fill outlines, edges on
  // whole units, absolute commands only. Holes wind against their outline, so
  // the default nonzero fill rule cuts them. Phase 3 moves the signed-off
  // shapes into CngxIconData.micro and deletes this table.
  protected readonly drafts = [
    {
      name: 'CNGX_ICON_ALERT',
      icon: CNGX_ICON_ALERT,
      a: 'M5 1H6L11 11H0ZM5 4L2 10H9L6 4ZM5 5H6V7H5ZM5 8H6V9H5Z',
      b: 'M5 1H7L12 11H0ZM5 4L2 10H10L7 4ZM5 5H7V7H5ZM5 8H7V9H5Z',
    },
    {
      name: 'CNGX_ICON_TRASH',
      icon: CNGX_ICON_TRASH,
      a: 'M4 1H8V3H7V2H5V3H4ZM1 3H11V4H1ZM2 4H3V10H9V4H10V11H2Z',
      b: 'M4 1H8V2H4ZM1 2H11V4H1ZM2 4H3V10H9V4H10V11H2Z',
    },
    {
      name: 'CNGX_ICON_X_CIRCLE',
      icon: CNGX_ICON_X_CIRCLE,
      a: 'M1 6A5 5 0 1 1 11 6A5 5 0 1 1 1 6ZM2 6A4 4 0 1 0 10 6A4 4 0 1 0 2 6ZM4 5L5 4L8 7L7 8ZM7 4L8 5L5 8L4 7Z',
      b: 'M1 6A5 5 0 1 1 11 6A5 5 0 1 1 1 6ZM3 6A3 3 0 1 0 9 6A3 3 0 1 0 3 6ZM4 5L5 4L8 7L7 8ZM7 4L8 5L5 8L4 7Z',
    },
    {
      name: 'CNGX_ICON_BELL',
      icon: CNGX_ICON_BELL,
      a: 'M2 8V5A4 4 0 0 1 10 5V8H11V9H1V8ZM3 8H9V5A3 3 0 0 0 3 5ZM5 10H7V11H5Z',
      b: 'M2 7V5A4 4 0 0 1 10 5V7H11V9H1V7ZM3 7H9V5A3 3 0 0 0 3 5ZM5 10H7V11H5Z',
    },
    {
      name: 'CNGX_ICON_BAN',
      icon: CNGX_ICON_BAN,
      a: 'M1 6A5 5 0 1 1 11 6A5 5 0 1 1 1 6ZM2 6A4 4 0 1 0 10 6A4 4 0 1 0 2 6ZM3 2L10 9L9 10L2 3Z',
      b: 'M1 6A5 5 0 1 1 11 6A5 5 0 1 1 1 6ZM3 6A3 3 0 1 0 9 6A3 3 0 1 0 3 6ZM3 2L10 9L9 10L2 3Z',
    },
    {
      name: 'CNGX_ICON_PLUS',
      icon: CNGX_ICON_PLUS,
      a: 'M5 1H6V5H10V6H6V10H5V6H1V5H5Z',
      b: 'M5 1H7V5H11V7H7V11H5V7H1V5H5Z',
    },
    {
      name: 'CNGX_ICON_CARET_DOWN',
      icon: CNGX_ICON_CARET_DOWN,
      a: 'M2 4H10V5H9V6H8V7H7V8H5V7H4V6H3V5H2Z',
      b: 'M2 4H10L6 8Z',
    },
  ] as const;

  protected readonly glyphs = {
    alert: CNGX_ICON_ALERT,
    ban: CNGX_ICON_BAN,
    caret: CNGX_ICON_CARET_DOWN,
    check: CNGX_ICON_CHECK,
    minus: CNGX_ICON_MINUS,
  } as const;

  protected readonly checkDraft = 'M2 6L3 5L5 7L9 3L10 4L5 9Z';
  protected readonly minusDraft = 'M3 5H9V7H3Z';

  protected readonly toneDrafts = [
    { tone: 'success', color: 'var(--cngx-status-success-color, oklch(0.65 0.18 145))', d: 'M2 6L3 5L5 7L9 3L10 4L5 9Z' },
    { tone: 'danger', color: 'var(--cngx-status-danger-color, oklch(0.65 0.22 25))', d: 'M3 4L4 3L9 8L8 9ZM8 3L9 4L4 9L3 8Z' },
    { tone: 'warning', color: 'var(--cngx-status-warning-color, oklch(0.75 0.15 85))', d: 'M5 2H7V8H5ZM5 9H7V11H5Z' },
    { tone: 'info', color: 'var(--cngx-status-info-color, oklch(0.6 0.14 250))', d: 'M5 1H7V3H5ZM4 4H7V9H8V10H4V9H5V5H4Z' },
    { tone: 'neutral', color: 'var(--cngx-status-neutral-color, oklch(0.6 0.02 290))', d: 'M4 1H8V2H4ZM3 2H4V4H3ZM8 2H9V5H8ZM6 5H8V6H6ZM5 6H7V8H5ZM5 9H7V11H5Z' },
  ] as const;`,
  template: `
  <div style="display:grid; grid-template-columns:repeat(7, auto) 1fr auto; align-items:center; justify-items:center; gap:8px 24px">
    <span>1em</span>
    @for (size of sizes; track size) {
      <span>{{ size }}</span>
    }
    <span>micro</span>
    <span style="justify-self:start">name</span>
    <span>paint</span>
    @for (entry of icons; track entry.name) {
      <svg [cngxIconSvg]="entry.icon"></svg>
      @for (size of sizes; track size) {
        <cngx-icon [size]="size"><svg [cngxIconSvg]="entry.icon"></svg></cngx-icon>
      }
      @if (entry.icon.micro) {
        <svg style="--cngx-icon-svg-size: 12px" [cngxIconSvg]="entry.icon"></svg>
      } @else {
        <span></span>
      }
      <code style="justify-self:start">{{ entry.name }}</code>
      <span>{{ entry.icon.paint }}</span>
    }
  </div>

  <h3>Small-size sheet</h3>
  <p>devicePixelRatio: <output>{{ dpr() }}</output> (follows the screen the window is on). Per size: 24-grid path, draft A, draft B.</p>
  <div style="display:grid; grid-template-columns:auto repeat(18, auto); align-items:center; justify-items:center; gap:8px 6px">
    <span></span>
    @for (size of sheetSizes; track size) {
      <span style="grid-column:span 3">{{ size }}px</span>
    }
    <span></span>
    @for (size of sheetSizes; track size) {
      <span>24</span><span>A</span><span>B</span>
    }
    @for (row of drafts; track row.name) {
      <code style="justify-self:start">{{ row.name }}</code>
      @for (size of sheetSizes; track size) {
        <svg [cngxIconSvg]="row.icon" [style.--cngx-icon-svg-size]="size + 'px'"></svg>
        <svg viewBox="0 0 12 12" [attr.width]="size" [attr.height]="size" aria-hidden="true"><path fill="currentColor" [attr.d]="row.a" /></svg>
        <svg viewBox="0 0 12 12" [attr.width]="size" [attr.height]="size" aria-hidden="true"><path fill="currentColor" [attr.d]="row.b" /></svg>
      }
    }
  </div>

  <h3>Checkbox check vs radio check skin</h3>
  <div style="display:flex; align-items:center; gap:16px">
    <cngx-checkbox-indicator [checked]="true" />
    <cngx-radio-indicator [checked]="true" skin="check" />
  </div>

  <h3>Checkbox sm vs md</h3>
  <ng-template #check12><svg [cngxIconSvg]="glyphs.check" style="--cngx-icon-svg-size:12px"></svg></ng-template>
  <ng-template #minus12><svg [cngxIconSvg]="glyphs.minus" style="--cngx-icon-svg-size:12px"></svg></ng-template>
  <ng-template #checkMicro><svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path fill="currentColor" [attr.d]="checkDraft" /></svg></ng-template>
  <ng-template #minusMicro><svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path fill="currentColor" [attr.d]="minusDraft" /></svg></ng-template>
  <div style="display:grid; grid-template-columns:auto auto auto; align-items:center; justify-items:center; gap:8px 16px">
    <span style="justify-self:start">sm today (10.5px glyph)</span>
    <cngx-checkbox-indicator size="sm" [checked]="true" />
    <cngx-checkbox-indicator size="sm" [indeterminate]="true" />
    <span style="justify-self:start">sm, 24 path at 12px</span>
    <cngx-checkbox-indicator size="sm" [checked]="true" [checkGlyph]="check12" />
    <cngx-checkbox-indicator size="sm" [indeterminate]="true" [dashGlyph]="minus12" />
    <span style="justify-self:start">sm, micro draft at 12px</span>
    <cngx-checkbox-indicator size="sm" [checked]="true" [checkGlyph]="checkMicro" />
    <cngx-checkbox-indicator size="sm" [indeterminate]="true" [dashGlyph]="minusMicro" />
    <span style="justify-self:start">md today (12px glyph)</span>
    <cngx-checkbox-indicator [checked]="true" />
    <cngx-checkbox-indicator [indeterminate]="true" />
    <span style="justify-self:start">md, micro draft at 12px</span>
    <cngx-checkbox-indicator [checked]="true" [checkGlyph]="checkMicro" />
    <cngx-checkbox-indicator [indeterminate]="true" [dashGlyph]="minusMicro" />
  </div>

  <h3>Failed and refused badges</h3>
  <div style="display:grid; grid-template-columns:auto repeat(4, auto); align-items:center; justify-items:center; gap:8px 16px">
    <span></span><span>tabs 16.1px</span><span>stepper 18.4px</span><span>shared 16px</span><span>below band 9px</span>
    <code style="justify-self:start">ALERT</code>
    <svg [cngxIconSvg]="glyphs.alert" style="--cngx-icon-svg-size:16.1px"></svg>
    <svg [cngxIconSvg]="glyphs.alert" style="--cngx-icon-svg-size:18.4px"></svg>
    <svg [cngxIconSvg]="glyphs.alert" style="--cngx-icon-svg-size:16px"></svg>
    <svg [cngxIconSvg]="glyphs.alert" style="--cngx-icon-svg-size:9px"></svg>
    <code style="justify-self:start">BAN</code>
    <svg [cngxIconSvg]="glyphs.ban" style="--cngx-icon-svg-size:16.1px"></svg>
    <svg [cngxIconSvg]="glyphs.ban" style="--cngx-icon-svg-size:18.4px"></svg>
    <svg [cngxIconSvg]="glyphs.ban" style="--cngx-icon-svg-size:16px"></svg>
    <svg [cngxIconSvg]="glyphs.ban" style="--cngx-icon-svg-size:9px"></svg>
  </div>

  <h3>Select and paginator carets</h3>
  <div style="display:grid; grid-template-columns:repeat(6, auto); align-items:center; justify-items:center; gap:8px 16px">
    <span>select 11.9px</span><span>select Material 11.1px</span><span>paginator 9.6px</span><span>24 path 12px</span><span>A 12px</span><span>B 12px</span>
    <svg [cngxIconSvg]="glyphs.caret" style="--cngx-icon-svg-size:11.9px"></svg>
    <svg [cngxIconSvg]="glyphs.caret" style="--cngx-icon-svg-size:11.1px"></svg>
    <svg [cngxIconSvg]="glyphs.caret" style="--cngx-icon-svg-size:9.6px"></svg>
    <svg [cngxIconSvg]="glyphs.caret" style="--cngx-icon-svg-size:12px"></svg>
    <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path fill="currentColor" [attr.d]="drafts[6].a" /></svg>
    <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path fill="currentColor" [attr.d]="drafts[6].b" /></svg>
  </div>

  <h3>Status tones: radial fit vs 12px micro</h3>
  <div style="display:grid; grid-template-columns:auto auto auto; align-items:center; justify-items:start; gap:8px 16px">
    @for (t of toneDrafts; track t.tone) {
      <code>{{ t.tone }}</code>
      <cngx-status [tone]="t.tone" [label]="t.tone + ', today'" />
      <span style="display:inline-flex; align-items:center; justify-content:center; inline-size:16px; block-size:16px; border-radius:50%; color:var(--cngx-status-dot-fg, white)" [style.background]="t.color"><svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path fill="currentColor" [attr.d]="t.d" /></svg></span>
    }
  </div>

  <h3>Stepper error line</h3>
  <div style="display:grid; gap:8px; font-size:13px">
    @for (mark of [glyphs.alert, glyphs.ban]; track $index) {
      <span style="display:inline-flex; align-items:center; gap:4px"><svg [cngxIconSvg]="mark" style="--cngx-icon-svg-size:1.15em"></svg>Step could not be saved (today, 14.95px)</span>
      <span style="display:inline-flex; align-items:center; gap:4px"><svg [cngxIconSvg]="mark" style="--cngx-icon-svg-size:12px"></svg>Step could not be saved (24 path, 12px)</span>
      <span style="display:inline-flex; align-items:center; gap:4px"><svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path fill="currentColor" [attr.d]="$index === 0 ? drafts[0].a : drafts[4].a" /></svg>Step could not be saved (draft A, 12px)</span>
      <span style="display:inline-flex; align-items:center; gap:4px"><svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path fill="currentColor" [attr.d]="$index === 0 ? drafts[0].b : drafts[4].b" /></svg>Step could not be saved (draft B, 12px)</span>
    }
  </div>`,
};
