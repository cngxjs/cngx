/**
 * Axis position. Top/bottom are X-axes; left/right are Y-axes. The
 * parent `<cngx-chart>` collects content-child axes and routes their
 * inputs to its `xScale` / `yScale` signals based on this discriminator.
 */
export type CngxAxisPosition = 'top' | 'right' | 'bottom' | 'left';

/**
 * Axis scale type. The chart's scale-builder picks the matching
 * `create*Scale` factory at the boundary; the axis itself stays
 * scale-implementation-agnostic.
 */
export type CngxAxisType = 'linear' | 'time' | 'band';
