import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Fixture for `material-bridge.story.ts`: Material's `arrow_drop_down`, the
 * glyph `mat-button` uses with `[matMenuTriggerFor]`, as the app-wide caret
 * through `CNGX_BUTTON_CARET_ICON`. The menu button wraps it in its caret
 * `<cngx-icon>`, so the icon bridge sizes it like a wrapped slot icon.
 */
@Component({
  selector: 'demo-material-caret',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `<mat-icon>arrow_drop_down</mat-icon>`,
})
export class MaterialCaret {}
