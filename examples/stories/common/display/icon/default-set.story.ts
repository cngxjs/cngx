import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Default glyphs (internal)',
  subtitle: 'Every glyph cngx draws itself, rendered from <code>@cngx/utils</code> path data by <code>svg[cngxIconSvg]</code>. Internal sign-off surface, not a public icon set.',
  description: 'Each row shows the glyph standalone at the running text size (1em) and projected into <code>&lt;cngx-icon&gt;</code> at every size preset (<code>xs</code> to <code>xl</code>), which then owns the box. Fill glyphs paint their area in <code>currentColor</code>; stroke glyphs paint only the outline with round caps. The micro column shows the 12-grid drawing in a 12px box for the icons that carry one and stays empty for the rest. Check the shapes in light, dark and forced colors. The small-size sheet below is the 1x sign-off surface for the 12-grid micro tier: every glyph with a micro drawing at 10 to 16px as its bare 24-grid path, as its bare micro drawing and as the shipped renderer, which picks the micro path in a 10 to 14px box. Open it at browser zoom 100% on a devicePixelRatio 1 screen. A second sign-off sheet below shows the signed-off 16-grid drawing for each band glyph at a 16px box next to the 24-grid path, read from the shipped <code>icon.small</code>.',
  audience: ['design'],
  focus: ['visual-variants'],
  apiComponents: ['CngxIconSvg'],
  moduleImports: [
    'import { CngxCheckboxIndicator, CngxIcon, CngxIconSvg, CngxRadioIndicator, CngxStatus } from \'@cngx/common/display\';',
    'import { CngxGrid } from \'@cngx/ui/layout\';',
    'import { CNGX_ICON_ALERT, CNGX_ICON_BAN, CNGX_ICON_CARET_DOWN, CNGX_ICON_CHECK, CNGX_ICON_CHEVRONS_LEFT, CNGX_ICON_CHEVRONS_RIGHT, CNGX_ICON_CHEVRON_LEFT, CNGX_ICON_CHEVRON_RIGHT, CNGX_ICON_DOT, CNGX_ICON_GRIP_VERTICAL, CNGX_ICON_MINUS, CNGX_ICON_MORE_HORIZONTAL, CNGX_ICON_MORE_VERTICAL, CNGX_ICON_PLUS, CNGX_ICON_TRIANGLE_DOWN, CNGX_ICON_TRIANGLE_UP, CNGX_ICON_X, CNGX_ICON_CHEVRON_DOWN, CNGX_ICON_TRASH, CNGX_ICON_DOWNLOAD, CNGX_ICON_X_CIRCLE, CNGX_ICON_CUT, CNGX_ICON_COPY, CNGX_ICON_CLIPBOARD, CNGX_ICON_SEARCH, CNGX_ICON_ZOOM_IN, CNGX_ICON_ZOOM_OUT, CNGX_ICON_MAXIMIZE, CNGX_ICON_UNDO, CNGX_ICON_REDO, CNGX_ICON_PENCIL, CNGX_ICON_BELL, CNGX_ICON_INFO, CNGX_ICON_EXCLAMATION, CNGX_ICON_EXCLAMATION_SOLID, CNGX_ICON_QUESTION, CNGX_ICON_INFO_CIRCLE, CNGX_ICON_CHECK_CIRCLE, CNGX_ICON_ARCHIVE, CNGX_ICON_VOLUME, CNGX_ICON_STOP, type CngxIconData } from \'@cngx/utils\';',
  ],
  imports: ['CngxCheckboxIndicator', 'CngxGrid', 'CngxIcon', 'CngxIconSvg', 'CngxRadioIndicator', 'CngxStatus'],
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

  // Only glyphs that carry a micro drawing get a row; a null micro keeps the 24-grid path.
  protected readonly sheetRows = this.icons.filter((entry) => entry.icon.micro !== null);

  protected readonly glyphs = {
    alert: CNGX_ICON_ALERT,
    ban: CNGX_ICON_BAN,
    caret: CNGX_ICON_CARET_DOWN,
    check: CNGX_ICON_CHECK,
    minus: CNGX_ICON_MINUS,
  } as const;

  // The band glyphs that carry a signed-off 16-grid drawing; the sheet reads the
  // shipped icon.small. CARET_DOWN keeps small: null (Q3) and drops out here.
  protected readonly smallRows = this.icons.filter((entry) => entry.icon.small !== null);

  protected readonly tones = [
    { tone: 'success', color: 'var(--cngx-status-success-color, oklch(0.65 0.18 145))', icon: CNGX_ICON_CHECK },
    { tone: 'danger', color: 'var(--cngx-status-danger-color, oklch(0.65 0.22 25))', icon: CNGX_ICON_X },
    { tone: 'warning', color: 'var(--cngx-status-warning-color, oklch(0.75 0.15 85))', icon: CNGX_ICON_EXCLAMATION_SOLID },
    { tone: 'info', color: 'var(--cngx-status-info-color, oklch(0.6 0.14 250))', icon: CNGX_ICON_INFO },
    { tone: 'neutral', color: 'var(--cngx-status-neutral-color, oklch(0.6 0.02 290))', icon: CNGX_ICON_QUESTION },
  ] as const;`,
  template: `
  <cngx-grid columns="repeat(7, auto) 1fr auto" gap="8px 24px" style="align-items:center; justify-items:center">
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
  </cngx-grid>

  <h3>Small-size sheet</h3>
  <p>devicePixelRatio: <output>{{ dpr() }}</output> (follows the screen the window is on). Per size: bare 24-grid path, bare micro drawing, shipped renderer.</p>
  <cngx-grid columns="auto repeat(18, auto)" gap="8px 6px" style="align-items:center; justify-items:center">
    <span></span>
    @for (size of sheetSizes; track size) {
      <span style="grid-column:span 3">{{ size }}px</span>
    }
    <span></span>
    @for (size of sheetSizes; track size) {
      <span>24</span><span>micro</span><span>set</span>
    }
    @for (row of sheetRows; track row.name) {
      <code style="justify-self:start">{{ row.name }}</code>
      @for (size of sheetSizes; track size) {
        <svg viewBox="0 0 24 24" [attr.width]="size" [attr.height]="size" aria-hidden="true" [attr.fill]="row.icon.paint === 'fill' ? 'currentColor' : 'none'" [attr.stroke]="row.icon.paint === 'stroke' ? 'currentColor' : 'none'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path [attr.d]="row.icon.d" /></svg>
        <svg viewBox="0 0 12 12" [attr.width]="size" [attr.height]="size" aria-hidden="true"><path fill="currentColor" [attr.d]="row.icon.micro?.d" /></svg>
        <svg [cngxIconSvg]="row.icon" [style.--cngx-icon-svg-size]="size + 'px'"></svg>
      }
    }
  </cngx-grid>

  <h3>16-grid sign-off sheet</h3>
  <p>The signed-off 16-grid drawings for the band consumers, each at a 16px box next to the 24-grid path. These are the shipped <code>icon.small</code> values. Open at browser zoom 100% on a devicePixelRatio 1 screen.</p>
  <div style="display:flex; flex-direction:column; gap:8px">
    @for (row of smallRows; track row.name) {
      <div style="display:flex; align-items:center; gap:20px">
        <code style="inline-size:220px">{{ row.name }}</code>
        <span style="display:inline-flex; flex-direction:column; align-items:center; gap:2px">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" [attr.fill]="row.icon.paint === 'fill' ? 'currentColor' : 'none'" [attr.stroke]="row.icon.paint === 'stroke' ? 'currentColor' : 'none'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path [attr.d]="row.icon.d" /></svg>
          <small>24</small>
        </span>
        <span style="display:inline-flex; flex-direction:column; align-items:center; gap:2px">
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" [attr.d]="row.icon.small?.d" /></svg>
          <small>16</small>
        </span>
      </div>
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
  <ng-template #checkMicro><svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path fill="currentColor" [attr.d]="glyphs.check.micro.d" /></svg></ng-template>
  <ng-template #minusMicro><svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path fill="currentColor" [attr.d]="glyphs.minus.micro.d" /></svg></ng-template>
  <cngx-grid columns="auto auto auto" gap="8px 16px" style="align-items:center; justify-items:center">
    <span style="justify-self:start">sm today (10.5px glyph)</span>
    <cngx-checkbox-indicator size="sm" [checked]="true" />
    <cngx-checkbox-indicator size="sm" [indeterminate]="true" />
    <span style="justify-self:start">sm, shipped glyph at 12px</span>
    <cngx-checkbox-indicator size="sm" [checked]="true" [checkGlyph]="check12" />
    <cngx-checkbox-indicator size="sm" [indeterminate]="true" [dashGlyph]="minus12" />
    <span style="justify-self:start">sm, bare micro at 12px</span>
    <cngx-checkbox-indicator size="sm" [checked]="true" [checkGlyph]="checkMicro" />
    <cngx-checkbox-indicator size="sm" [indeterminate]="true" [dashGlyph]="minusMicro" />
    <span style="justify-self:start">md today (12px glyph)</span>
    <cngx-checkbox-indicator [checked]="true" />
    <cngx-checkbox-indicator [indeterminate]="true" />
    <span style="justify-self:start">md, bare micro at 12px</span>
    <cngx-checkbox-indicator [checked]="true" [checkGlyph]="checkMicro" />
    <cngx-checkbox-indicator [indeterminate]="true" [dashGlyph]="minusMicro" />
  </cngx-grid>

  <h3>Failed and refused badges</h3>
  <cngx-grid columns="auto repeat(4, auto)" gap="8px 16px" style="align-items:center; justify-items:center">
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
  </cngx-grid>

  <h3>Select and paginator carets</h3>
  <cngx-grid columns="repeat(5, auto)" gap="8px 16px" style="align-items:center; justify-items:center">
    <span>select 11.9px</span><span>select Material 11.1px</span><span>paginator 9.6px</span><span>bare 24 path 12px</span><span>bare micro 12px</span>
    <svg [cngxIconSvg]="glyphs.caret" style="--cngx-icon-svg-size:11.9px"></svg>
    <svg [cngxIconSvg]="glyphs.caret" style="--cngx-icon-svg-size:11.1px"></svg>
    <svg [cngxIconSvg]="glyphs.caret" style="--cngx-icon-svg-size:9.6px"></svg>
    <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path fill="currentColor" [attr.d]="glyphs.caret.d" /></svg>
    <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path fill="currentColor" [attr.d]="glyphs.caret.micro.d" /></svg>
  </cngx-grid>

  <h3>Status tones: shipped vs 12px glyph in a 16px dot</h3>
  <cngx-grid columns="auto auto auto" gap="8px 16px" style="align-items:center; justify-items:start">
    @for (t of tones; track t.tone) {
      <code>{{ t.tone }}</code>
      <cngx-status [tone]="t.tone" [label]="t.tone + ', today'" />
      <span style="display:inline-flex; align-items:center; justify-content:center; inline-size:16px; block-size:16px; border-radius:50%; color:var(--cngx-status-dot-fg, white)" [style.background]="t.color"><svg [cngxIconSvg]="t.icon" style="--cngx-icon-svg-size:12px"></svg></span>
    }
  </cngx-grid>

  <h3>Stepper error line</h3>
  <cngx-grid columns="1" gap="8px" style="font-size:13px">
    @for (mark of [glyphs.alert, glyphs.ban]; track $index) {
      <span style="display:inline-flex; align-items:center; gap:4px"><svg [cngxIconSvg]="mark" style="--cngx-icon-svg-size:1.15em"></svg>Step could not be saved (today, 14.95px)</span>
      <span style="display:inline-flex; align-items:center; gap:4px"><svg [cngxIconSvg]="mark" style="--cngx-icon-svg-size:12px"></svg>Step could not be saved (micro, 12px)</span>
    }
  </cngx-grid>`,
};
