import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CNGX_BUTTON_CLOSE_ICON, CngxCloseButton } from '@cngx/common/button';

/**
 * Chrome fixture for `provided-icon.story.ts`: a close button outside the
 * story's `provideButtonCloseIcon` scope, so the default X renders next to
 * the provided and the projected glyph for comparison. The `null` value
 * clears the provider for this subtree only.
 */
@Component({
  selector: 'demo-default-close-reference',
  standalone: true,
  imports: [CngxCloseButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [{ provide: CNGX_BUTTON_CLOSE_ICON, useValue: null }],
  template: `<button cngxCloseButton aria-label="Close preview"></button>`,
  host: { style: 'display: contents' },
})
export class DefaultCloseReference {}
