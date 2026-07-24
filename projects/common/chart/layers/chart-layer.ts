import { InjectionToken, type Signal } from '@angular/core';

/**
 * Backend-agnostic geometry a layer atom publishes for rendering. A
 * discriminated union: each variant carries exactly the primitives its
 * kind needs, and nothing more. Both the SVG self-render path and the
 * Phase-3 Canvas renderer paint against this same shape, so a single
 * layer-authoring API drives either backend.
 *
 * Coordinates are already scale-projected (pixel space); `color` is
 * `null` when the atom defers to its CSS custom property (the SVG path
 * reads the var directly, the Canvas renderer resolves it via
 * `getComputedStyle`).
 *
 * @category common/chart/layers
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/layers/chart-layer.ts
 * @since 0.1.0
 */
export type LayerGeometry =
  | {
      readonly kind: 'line' | 'area';
      readonly d: string;
      readonly color: string | null;
      readonly strokeWidth: number | string | null;
      readonly fill?: string | null;
      readonly opacity?: number | null;
    }
  | {
      readonly kind: 'bar';
      readonly rects: readonly {
        readonly x: number;
        readonly y: number;
        readonly w: number;
        readonly h: number;
        readonly color: string | null;
      }[];
    }
  | {
      readonly kind: 'scatter';
      readonly marks: readonly {
        readonly cx: number;
        readonly cy: number;
        readonly r: number;
        readonly color: string | null;
      }[];
    }
  | {
      readonly kind: 'threshold';
      readonly x1: number;
      readonly y1: number;
      readonly x2: number;
      readonly y2: number;
      readonly color: string | null;
      readonly dashed: boolean;
    }
  | {
      readonly kind: 'band';
      readonly x: number;
      readonly y: number;
      readonly w: number;
      readonly h: number;
      readonly color: string | null;
      readonly opacity: number | null;
    };

/**
 * Contract every layer atom (`[cngxLine]`, `[cngxBar]`, ...) self-provides
 * via {@link CNGX_CHART_LAYER}. The chart shell and the Canvas renderer
 * read layer geometry through this token instead of scraping the DOM.
 *
 * @category common/chart/layers
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/layers/chart-layer.ts
 * @since 0.1.0
 */
export interface CngxChartLayer {
  /** The layer's geometry variant discriminator. */
  readonly kind: Signal<LayerGeometry['kind']>;
  /** The layer's scale-projected geometry, cascade-guarded by an `equal` fn. */
  readonly geometry: Signal<LayerGeometry>;
}

/**
 * Injection token each layer atom provides via
 * `{ provide: CNGX_CHART_LAYER, useExisting: CngxX }`. A
 * `contentChildren(CNGX_CHART_LAYER, { descendants: true })` query on the
 * chart shell collects every mounted layer's geometry through DI.
 *
 * @category common/chart/layers
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/layers/chart-layer.ts
 * @since 0.1.0
 * @relatedTo CngxLine, CngxArea, CngxBar, CngxScatter, CngxThreshold, CngxBand
 */
export const CNGX_CHART_LAYER = new InjectionToken<CngxChartLayer>('CngxChartLayer');
