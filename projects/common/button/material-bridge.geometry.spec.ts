import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxAvatar, CngxIcon } from '@cngx/common/display';

import { CngxButtonGroupAddon } from './button-group-addon.directive';
import { CngxButtonGroup } from './button-group.directive';
import { CngxButton } from './button.component';
import type { CngxButtonSize } from './button.types';
import { CngxCloseButton } from './close-button.component';
import { CngxIconButton } from './icon-button.component';
import { CngxButtonStart } from './slots';

// Runs in a real Chromium (the `test-geometry` target). Material styles
// `.mat-icon` unlayered at 24px, which beats the layered slot and glyph rules,
// so without a bridge a <mat-icon> stays 24px at every button size. The
// pattern is a <mat-icon> wrapped in <cngx-icon>; the icon bridge
// (material-bridge.spec-host.scss compiles icon-theme.scss) sizes the wrapped
// glyph to the cngx-icon rung, which is the size the svg glyph has in the same
// place. Material's stylesheet is not loaded here:
// its `.mat-icon` rule and the icon font's `.material-icons` rule are copied
// below and appended after the component styles, the worst case for order.

const MATERIAL_ICON_RULES = `
.mat-icon {
  -webkit-user-select: none;
  user-select: none;
  background-repeat: no-repeat;
  display: inline-block;
  fill: currentColor;
  height: 24px;
  width: 24px;
  overflow: hidden;
}
.material-icons {
  font-family: 'Material Icons';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  display: inline-block;
  white-space: nowrap;
}
`;

const SIZES: readonly CngxButtonSize[] = ['xs', 'sm', 'md', 'lg'];

@Component({
  selector: 'cngx-material-bridge-geometry-host',
  standalone: true,
  imports: [CngxButton, CngxButtonStart, CngxIconButton, CngxCloseButton, CngxIcon],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../core/theming/reset.css',
    '../../core/theming/base.css',
    '../../core/theming/density-tokens.css',
    './material-bridge.spec-host.scss',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (size of sizes; track size) {
      <p>
        <button cngxButton class="slot-svg-{{ size }}" [size]="size">
          <svg cngxButtonStart viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add
        </button>
        <button cngxButton class="slot-mat-{{ size }}" [size]="size">
          <cngx-icon cngxButtonStart
            ><span class="mat-icon notranslate material-icons mat-ligature-font" aria-hidden="true"
              >add</span
            ></cngx-icon
          >
          Add
        </button>
      </p>
      <p>
        <button cngxIconButton class="icon-svg-{{ size }}" [size]="size" aria-label="Add">
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
        </button>
        <button cngxIconButton class="icon-mat-{{ size }}" [size]="size" aria-label="Add">
          <cngx-icon
            ><span class="mat-icon notranslate material-icons mat-ligature-font">add</span></cngx-icon
          >
        </button>
        <button
          cngxCloseButton
          class="close-svg-{{ size }}"
          [size]="size"
          aria-label="Close"
        ></button>
        <button cngxCloseButton class="close-mat-{{ size }}" [size]="size" aria-label="Close">
          <cngx-icon
            ><span class="mat-icon notranslate material-icons mat-ligature-font">close</span></cngx-icon
          >
        </button>
      </p>
    }
  `,
})
class MaterialBridgeGeometryHost {
  readonly sizes = SIZES;
}

let mountedRoot: HTMLElement | null = null;
let materialRules: HTMLStyleElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(MaterialBridgeGeometryHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  materialRules = document.createElement('style');
  materialRules.textContent = MATERIAL_ICON_RULES;
  document.head.appendChild(materialRules);
  return mountedRoot;
}

function box(root: ParentNode, selector: string): { width: number; height: number } {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  const rect = el.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  materialRules?.remove();
  materialRules = null;
});

describe('Material bridge: wrapped mat-icon in the button family', () => {
  it.each(SIZES)('a wrapped mat-icon in a start slot matches the svg glyph at %s', (size) => {
    const root = mount();
    const svg = box(root, `.slot-svg-${size} svg`);
    expect(svg.width).toBeGreaterThan(0);
    expect(box(root, `.slot-mat-${size} .mat-icon`)).toEqual(svg);
  });

  it.each(SIZES)('a wrapped mat-icon in an icon button matches the svg glyph at %s', (size) => {
    const root = mount();
    const svg = box(root, `.icon-svg-${size} svg`);
    expect(svg.width).toBeGreaterThan(0);
    expect(box(root, `.icon-mat-${size} .mat-icon`)).toEqual(svg);
  });

  it.each(SIZES)('a wrapped mat-icon in a close button matches the default X glyph at %s', (size) => {
    const root = mount();
    const svg = box(root, `.close-svg-${size} svg`);
    expect(svg.width).toBeGreaterThan(0);
    expect(box(root, `.close-mat-${size} .mat-icon`)).toEqual(svg);
  });

  it('leaves the 24px Material default behind at the small sizes', () => {
    const root = mount();
    expect(box(root, '.slot-mat-xs .mat-icon').width).toBeLessThan(24);
    expect(box(root, '.icon-mat-xs .mat-icon').width).toBeLessThan(24);
  });
});

// Metrics and type. The M3 reference values were read off the real Material
// 3 buttons in the examples app (/material-lab, density 0): mat-flat-button,
// the tonal and the stroked button are 40px high with 24px inline padding and
// a 14px / 500 label-large label on a 20px line; mat-button (text) pads 12px;
// a leading icon sits 16px from the edge; matIconButton is 40x40. Material
// itself is not loaded here, so the numbers are pinned.
const M3 = {
  height: 40,
  inline: 24,
  text: 12,
  slot: 16,
  font: 14,
  weight: '500',
  line: 20,
  slotIcon: 18,
  glyph: 24,
};

@Component({
  selector: 'cngx-material-bridge-metrics-host',
  standalone: true,
  imports: [CngxButton, CngxButtonStart, CngxIconButton, CngxCloseButton, CngxIcon],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../core/theming/reset.css',
    '../../core/theming/base.css',
    '../../core/theming/density-tokens.css',
    './material-bridge.spec-host.scss',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (density of densities; track density) {
      <div [attr.data-density]="density">
        <button cngxButton tone="primary" class="solid-{{ density }}">Save</button>
        <button cngxButton="secondary" class="secondary-{{ density }}">Save draft</button>
        <button cngxButton="outline" class="outline-{{ density }}">Export</button>
        <button cngxButton="ghost" tone="primary" class="ghost-{{ density }}">Cancel</button>
        <button cngxButton tone="primary" class="start-{{ density }}">
          <cngx-icon cngxButtonStart><svg viewBox="0 0 24 24"><path d="M12 5v14" /></svg></cngx-icon>
          New item
        </button>
        <button cngxButton="ghost" class="ghost-start-{{ density }}">
          <cngx-icon cngxButtonStart><svg viewBox="0 0 24 24"><path d="M12 5v14" /></svg></cngx-icon>
          Reply
        </button>
        <button cngxIconButton class="icon-{{ density }}" aria-label="Delete">
          <svg viewBox="0 0 24 24"><path d="M12 5v14" /></svg>
        </button>
        <button cngxIconButton class="icon-wrapped-{{ density }}" aria-label="Delete">
          <cngx-icon><svg viewBox="0 0 24 24"><path d="M12 5v14" /></svg></cngx-icon>
        </button>
        <button cngxCloseButton class="close-{{ density }}" size="md" aria-label="Close"></button>
        <button cngxCloseButton class="close-default-{{ density }}" aria-label="Close"></button>
      </div>
    }
    <p>
      @for (size of sizes; track size) {
        <button cngxButton tone="primary" class="size-{{ size }}" [size]="size">Save</button>
        <button cngxIconButton class="icon-size-{{ size }}" [size]="size" aria-label="Delete">
          <svg viewBox="0 0 24 24"><path d="M12 5v14" /></svg>
        </button>
      }
    </p>
  `,
})
class MaterialBridgeMetricsHost {
  readonly densities = ['comfortable', 'compact', 'spacious'] as const;
  readonly sizes = SIZES;
}

function mountMetrics(): HTMLElement {
  const fixture = TestBed.createComponent(MaterialBridgeMetricsHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

interface Metrics {
  height: number;
  width: number;
  start: number;
  end: number;
  font: number;
  weight: string;
  line: number;
}

function metrics(root: ParentNode, selector: string): Metrics {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  const style = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  return {
    height: rect.height,
    width: rect.width,
    start: parseFloat(style.paddingInlineStart),
    end: parseFloat(style.paddingInlineEnd),
    font: parseFloat(style.fontSize),
    weight: style.fontWeight,
    line: parseFloat(style.lineHeight),
  };
}

describe('Material bridge: M3 metrics and label type', () => {
  it('matches the M3 filled, tonal and outlined button at comfortable', () => {
    const root = mountMetrics();
    for (const variant of ['solid', 'secondary', 'outline']) {
      const m = metrics(root, `.${variant}-comfortable`);
      expect(m.height, variant).toBe(M3.height);
      expect([m.start, m.end], variant).toEqual([M3.inline, M3.inline]);
      expect([m.font, m.weight, m.line], variant).toEqual([M3.font, M3.weight, M3.line]);
    }
  });

  it('matches the M3 text button at comfortable', () => {
    const m = metrics(mountMetrics(), '.ghost-comfortable');
    expect(m.height).toBe(M3.height);
    expect([m.start, m.end]).toEqual([M3.text, M3.text]);
  });

  it('pads a leading icon like M3 (16 / 24 filled, 12 / 16 text)', () => {
    const root = mountMetrics();
    const filled = metrics(root, '.start-comfortable');
    expect([filled.start, filled.end]).toEqual([M3.slot, M3.inline]);
    expect(filled.height).toBe(M3.height);
    const text = metrics(root, '.ghost-start-comfortable');
    expect([text.start, text.end]).toEqual([M3.text, M3.slot]);
  });

  it('squares the icon button to the M3 40px box', () => {
    const m = metrics(mountMetrics(), '.icon-comfortable');
    expect([m.width, m.height]).toEqual([M3.height, M3.height]);
  });

  it('sizes a slot icon 18px and an icon-button glyph 24px, svg or cngx-icon', () => {
    const root = mountMetrics();
    const slot = box(root, '.start-comfortable cngx-icon');
    expect(slot.width).toBeCloseTo(M3.slotIcon, 1);
    expect(slot.height).toBeCloseTo(M3.slotIcon, 1);
    expect(box(root, '.icon-comfortable svg')).toEqual({ width: M3.glyph, height: M3.glyph });
    expect(box(root, '.icon-wrapped-comfortable cngx-icon svg')).toEqual({
      width: M3.glyph,
      height: M3.glyph,
    });
  });

  it('gives a md close button the M3 icon-button box and glyph', () => {
    const root = mountMetrics();
    const close = metrics(root, '.close-comfortable');
    expect([close.width, close.height]).toEqual([M3.height, M3.height]);
    expect(box(root, '.close-comfortable svg')).toEqual({ width: M3.glyph, height: M3.glyph });
    expect(metrics(root, '.close-compact').height).toBe(30);
  });

  it('gives the default (sm) close button the M3 icon-button box and glyph', () => {
    const root = mountMetrics();
    const close = metrics(root, '.close-default-comfortable');
    expect([close.width, close.height]).toEqual([M3.height, M3.height]);
    expect(box(root, '.close-default-comfortable svg')).toEqual({
      width: M3.glyph,
      height: M3.glyph,
    });
    // Re-scaled with the md icon button in density islands; the glyph stays.
    for (const density of ['compact', 'spacious']) {
      const scaled = metrics(root, `.close-default-${density}`);
      const icon = metrics(root, `.icon-${density}`);
      expect([scaled.width, scaled.height], density).toEqual([icon.width, icon.height]);
      expect(box(root, `.close-default-${density} svg`), density).toEqual({
        width: M3.glyph,
        height: M3.glyph,
      });
    }
    expect(metrics(root, '.close-default-compact').height).toBe(30);
    expect(metrics(root, '.close-default-spacious').height).toBe(50);
  });

  it('re-scales the bridged button in compact and spacious islands', () => {
    const root = mountMetrics();
    const compact = metrics(root, '.solid-compact');
    const spacious = metrics(root, '.solid-spacious');
    // lg rung: 12 / 24 / 28; box = 20 line + 2 * (sm * 1.25), border inside.
    expect([compact.start, compact.height]).toEqual([12, 30]);
    expect([spacious.start, spacious.height]).toEqual([28, 50]);
    expect(metrics(root, '.ghost-compact').start).toBe(6);
    expect(metrics(root, '.ghost-spacious').start).toBe(18);
    // A filled slot side is 2/3 of the inline padding.
    expect(metrics(root, '.start-compact').start).toBe(8);
    expect(metrics(root, '.start-spacious').start).toBeCloseTo(28 * (2 / 3), 1);
    const icon = metrics(root, '.icon-compact');
    expect([icon.width, icon.height]).toEqual([30, 30]);
    // The label type does not follow density.
    expect([compact.font, spacious.font]).toEqual([M3.font, M3.font]);
  });

  it('steps the sizes 28 / 32 / 40 / 48 around the M3 md box', () => {
    const root = mountMetrics();
    const heights = SIZES.map((size) => metrics(root, `.size-${size}`).height);
    expect(heights).toEqual([28, 32, 40, 48]);
    // label-medium / label-large / label-large / title-medium.
    const type = SIZES.map((size) => {
      const m = metrics(root, `.size-${size}`);
      return [m.font, m.line];
    });
    expect(type).toEqual([
      [12, 16],
      [14, 20],
      [14, 20],
      [16, 24],
    ]);
    const icons = SIZES.map((size) => metrics(root, `.icon-size-${size}`).width);
    expect(icons).toEqual([28, 32, 40, 48]);
  });
});

// The group addon shares the bridged metric and type rows: height, label type
// and inline padding equal the sibling button at every size and density. The
// group start-aligns its segments so a stretched row cannot hide a mismatch.
@Component({
  selector: 'cngx-material-bridge-addon-host',
  standalone: true,
  imports: [CngxButtonGroup, CngxButtonGroupAddon, CngxButton, CngxAvatar],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../core/theming/reset.css',
    '../../core/theming/base.css',
    '../../core/theming/density-tokens.css',
    '../theming/components/cngx-button-group.css',
    './material-bridge.spec-host.scss',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (density of densities; track density) {
      <div [attr.data-density]="density">
        @for (size of sizes; track size) {
          <p>
            <span cngxButtonGroup variant="outline" [size]="size" style="align-items: flex-start" aria-label="Issues"
              ><span cngxButtonGroupAddon class="addon-{{ density }}-{{ size }}">3 open</span
              ><button cngxButton class="btn-{{ density }}-{{ size }}">Show</button></span
            >
          </p>
          <p>
            <span cngxButtonGroup variant="outline" [size]="size" class="avatar-row-{{ density }}-{{ size }}" aria-label="Assignee"
              ><span cngxButtonGroupAddon class="avatar-addon-{{ density }}-{{ size }}"
                ><cngx-avatar initials="AL" size="xs" />Ada Lovelace</span
              ><button cngxButton>Reassign</button></span
            >
          </p>
        }
      </div>
    }
  `,
})
class MaterialBridgeAddonHost {
  readonly densities = ['comfortable', 'compact', 'spacious'] as const;
  readonly sizes = SIZES;
}

describe('Material bridge: button-group addon', () => {
  it.each(['comfortable', 'compact', 'spacious'] as const)(
    'puts the addon on the bridged button row at every size (%s)',
    (density) => {
      const fixture = TestBed.createComponent(MaterialBridgeAddonHost);
      mountedRoot = fixture.nativeElement as HTMLElement;
      document.body.appendChild(mountedRoot);
      fixture.detectChanges();
      for (const size of SIZES) {
        const { width: _addonWidth, ...addon } = metrics(mountedRoot, `.addon-${density}-${size}`);
        const { width: _btnWidth, ...btn } = metrics(mountedRoot, `.btn-${density}-${size}`);
        expect(addon, size).toEqual(btn);
      }
    },
  );

  // M3 label-large is a 20px line; a 24px xs avatar in the addon would
  // stretch the row to 44px. Capped to the line box it keeps the bridged row.
  it.each(['comfortable', 'compact', 'spacious'] as const)(
    'keeps an avatar addon row on the bridged button height at every size (%s)',
    (density) => {
      const fixture = TestBed.createComponent(MaterialBridgeAddonHost);
      mountedRoot = fixture.nativeElement as HTMLElement;
      document.body.appendChild(mountedRoot);
      fixture.detectChanges();
      for (const size of SIZES) {
        const button = metrics(mountedRoot, `.btn-${density}-${size}`);
        const group = metrics(mountedRoot, `.avatar-row-${density}-${size}`);
        expect(group.height, size).toBeCloseTo(button.height, 1);
        const avatar = metrics(mountedRoot, `.avatar-addon-${density}-${size} > cngx-avatar`);
        expect(avatar.width, size).toBe(avatar.height);
        expect(avatar.height, size).toBeLessThanOrEqual(button.line);
      }
    },
  );

  it('gives the md addon the M3 row and label type at comfortable', () => {
    const fixture = TestBed.createComponent(MaterialBridgeAddonHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    const m = metrics(mountedRoot, '.addon-comfortable-md');
    expect(m.height).toBe(M3.height);
    expect([m.start, m.end]).toEqual([M3.inline, M3.inline]);
    expect([m.font, m.weight, m.line]).toEqual([M3.font, M3.weight, M3.line]);
  });
});
