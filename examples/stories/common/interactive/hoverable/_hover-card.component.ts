import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';

import { CngxHoverable } from '@cngx/common/interactive';

/**
 * Fixture for `as-host-directive.story.ts`. Demonstrates how a consumer
 * component composes `CngxHoverable` into its own host via the
 * `hostDirectives` config and reads the hover signal back through
 * `inject(CngxHoverable, { host: true })`. The card paints itself
 * differently when hovered without any consumer-side
 * `mouseenter` / `mouseleave` wiring.
 */
@Component({
  selector: 'demo-hover-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [CngxHoverable],
  host: {
    class: 'demo-hover-card',
    '[class.demo-hover-card--active]': 'hover.hovered()',
  },
  template: `
    <span class="demo-hover-card__label"><ng-content /></span>
    <span class="demo-hover-card__state">{{ hover.hovered() ? 'hovered' : 'idle' }}</span>
  `,
})
export class HoverCard {
  protected readonly hover = inject(CngxHoverable, { host: true });
}
