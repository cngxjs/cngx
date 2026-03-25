import { NgTemplateOutlet } from '@angular/common';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- TemplateRef is needed as DI token at runtime
import {
  ChangeDetectionStrategy,
  Component,
  contentChild,
  Directive,
  input,
  model,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';

import { CngxTruncate } from './truncate.directive';

/** Template context for the custom toggle template. */
export interface CngxExpandableToggleContext {
  /** Whether the text is currently expanded. */
  $implicit: boolean;
  /** Whether the text is currently expanded. */
  expanded: boolean;
  /** Call to toggle the expanded state. */
  toggle: () => void;
}

/**
 * Marks a custom toggle template inside `cngx-expandable-text`.
 *
 * ```html
 * <cngx-expandable-text [lines]="3">
 *   Long text…
 *   <ng-template cngxExpandableToggle let-expanded let-toggle="toggle">
 *     <button (click)="toggle()" class="icon-btn">
 *       <mat-icon>{{ expanded ? 'expand_less' : 'expand_more' }}</mat-icon>
 *     </button>
 *   </ng-template>
 * </cngx-expandable-text>
 * ```
 */
@Directive({
  selector: 'ng-template[cngxExpandableToggle]',
  standalone: true,
})
export class CngxExpandableToggle {
  constructor(public readonly templateRef: TemplateRef<CngxExpandableToggleContext>) {}
}

/**
 * Molecule wrapping `CngxTruncate` with a built-in expand/collapse toggle.
 *
 * Projects content into a truncated container and conditionally renders
 * a "Show more" / "Show less" button when the content is actually clamped.
 * Handles `aria-expanded` automatically.
 *
 * Supports custom toggle templates via `ng-template[cngxExpandableToggle]` —
 * use for icon buttons or any custom UI instead of plain text labels.
 *
 * @usageNotes
 *
 * ### Basic usage
 * ```html
 * <cngx-expandable-text [lines]="3">
 *   Long text that may or may not overflow the container…
 * </cngx-expandable-text>
 * ```
 *
 * ### Custom labels
 * ```html
 * <cngx-expandable-text [lines]="2" moreLabel="Mehr" lessLabel="Weniger">
 *   Langer Text…
 * </cngx-expandable-text>
 * ```
 *
 * ### Custom toggle template
 * ```html
 * <cngx-expandable-text [lines]="3">
 *   Long text…
 *   <ng-template cngxExpandableToggle let-expanded let-toggle="toggle">
 *     <button (click)="toggle()">{{ expanded ? 'Collapse' : 'Expand' }}</button>
 *   </ng-template>
 * </cngx-expandable-text>
 * ```
 *
 * @category layout
 */
@Component({
  selector: 'cngx-expandable-text',
  exportAs: 'cngxExpandableText',
  standalone: true,
  imports: [CngxTruncate, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'style': 'display:block',
  },
  template: `
    <div [cngxTruncate]="lines()" [(expanded)]="expanded" #trunc="cngxTruncate">
      <ng-content />
    </div>
    @if (trunc.isClamped() || expanded()) {
      @if (customToggle(); as tpl) {
        <ng-container [ngTemplateOutlet]="tpl.templateRef"
                      [ngTemplateOutletContext]="toggleContext()" />
      } @else {
        <button type="button"
                class="cngx-expandable-text__toggle"
                [attr.aria-expanded]="expanded()"
                (click)="expanded.set(!expanded())">
          {{ expanded() ? lessLabel() : moreLabel() }}
        </button>
      }
    }
  `,
})
export class CngxExpandableText {
  /** Maximum visible lines when collapsed. */
  readonly lines = input<number>(3);
  /** Whether the text is expanded. Supports two-way `[(expanded)]` binding. */
  readonly expanded = model<boolean>(false);
  /** Label for the "show more" button. */
  readonly moreLabel = input<string>('Show more');
  /** Label for the "show less" button. */
  readonly lessLabel = input<string>('Show less');

  /** Optional custom toggle template projected by the consumer. */
  protected readonly customToggle = contentChild(CngxExpandableToggle);

  /** Template context for the custom toggle. */
  protected toggleContext(): CngxExpandableToggleContext {
    return {
      $implicit: this.expanded(),
      expanded: this.expanded(),
      toggle: () => this.expanded.set(!this.expanded()),
    };
  }
}
