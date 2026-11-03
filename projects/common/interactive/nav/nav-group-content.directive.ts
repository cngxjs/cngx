import { computed, Directive, effect, ElementRef, inject, input, untracked } from '@angular/core';
import type { CngxNavGroup } from './nav-group.directive';

/**
 * Animated content region of a `CngxNavGroup`.
 *
 * The animated nav group keeps its links in the DOM while collapsed, so the
 * collapse can run as a CSS height transition. Links that stay in the DOM stay
 * focusable and stay in the accessibility tree unless something removes them.
 * This directive owns that part: it sets the `.cngx-nav-group-content` /
 * `--open` classes the sidenav stylesheet animates, and it sets `inert` while
 * the group is closed. `inert` drops on open and lands on close at once; the
 * height transition still runs, but nothing inside a collapsing group can take
 * focus or be reached by a screen reader. When the group closes while focus
 * sits inside the region (a programmatic close, or a single-accordion sibling
 * opening), focus moves to the group trigger first instead of falling to
 * `<body>`.
 *
 * Reach for it whenever the group content is not removed with `@if`. The
 * `@if` path needs no directive: removed nodes are neither focusable nor
 * exposed.
 *
 * The group is passed as an explicit reference, never resolved from an
 * ancestor. Open state has one source, `group.disclosure.opened()`.
 *
 * ### Animated nav group
 * ```html
 * <button cngxNavGroup #group="cngxNavGroup" [controls]="'settings-nav'"
 *         id="settings-label">
 *   Settings
 * </button>
 * <div [cngxNavGroupContent]="group">
 *   <div id="settings-nav" role="group" aria-labelledby="settings-label">
 *     <a cngxNavLink [depth]="1">General</a>
 *     <a cngxNavLink [depth]="1">Security</a>
 *   </div>
 * </div>
 * ```
 *
 * The grid-rows animation needs exactly one wrapper child inside the host.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/nav/nav-group-content.directive.ts
 * @since 0.1.0
 * @relatedTo CngxNavGroup, CngxDisclosure
 * <example-url>/#/ui/sidenav/full-navigation-sidebar</example-url>
 * @axis level atom
 */
@Directive({
  selector: '[cngxNavGroupContent]',
  exportAs: 'cngxNavGroupContent',
  standalone: true,
  host: {
    '[class.cngx-nav-group-content]': 'true',
    '[class.cngx-nav-group-content--open]': 'opened()',
    '[attr.inert]': "opened() ? null : ''",
  },
})
export class CngxNavGroupContent {
  /** The `CngxNavGroup` whose disclosure state this region follows. */
  readonly group = input.required<CngxNavGroup>({ alias: 'cngxNavGroupContent' });

  /** Whether the referenced group is open. */
  protected readonly opened = computed(() => this.group().disclosure.opened());

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    // Runs before the host's inert binding is refreshed: focus is still inside
    // the region here, so it can be handed to the trigger before inert drops it.
    effect(() => {
      if (this.opened()) {
        return;
      }
      untracked(() => {
        const active = this.host.ownerDocument.activeElement;
        if (active && this.host.contains(active)) {
          this.group().focus({ preventScroll: true });
        }
      });
    });
  }
}
