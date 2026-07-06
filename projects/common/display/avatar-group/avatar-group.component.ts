import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  ElementRef,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { CngxAvatar } from '../avatar/avatar.component';

/**
 * Stacked avatar group with an overflow pill. Project `<cngx-avatar>` children;
 * with `[max]` set, the group shows the first `max` and renders a `+N` pill for
 * the rest. The visible/hidden split is a `computed()` over the projected
 * avatars and `max` - the overflow count is derived, never tracked by hand
 * (Pillar 1) - and the group carries an `aria-label` summarising the total and
 * hidden counts so assistive tech hears "7 teammates, 4 not shown".
 *
 * ```html
 * <cngx-avatar-group [max]="3" label="teammates">
 *   <cngx-avatar initials="AK" />
 *   <cngx-avatar initials="JD" />
 *   <cngx-avatar initials="MR" />
 *   <cngx-avatar initials="PL" />
 *   <cngx-avatar initials="ST" />
 * </cngx-avatar-group>
 * ```
 *
 * @category common/display
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/display/avatar-group/avatar-group.component.ts
 * @since 0.1.0
 * @relatedTo CngxAvatar
 */
@Component({
  selector: 'cngx-avatar-group',
  exportAs: 'cngxAvatarGroup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './avatar-group.css',
  host: {
    class: 'cngx-avatar-group',
    role: 'group',
    '[attr.aria-label]': 'ariaLabel()',
    '[class.cngx-avatar-group--xs]': 'size() === "xs"',
    '[class.cngx-avatar-group--sm]': 'size() === "sm"',
    '[class.cngx-avatar-group--md]': 'size() === "md"',
    '[class.cngx-avatar-group--lg]': 'size() === "lg"',
    '[class.cngx-avatar-group--xl]': 'size() === "xl"',
    '[class.cngx-avatar-group--square]': 'shape() === "square"',
  },
  template: `
    <ng-content select="cngx-avatar" />
    @if (hiddenCount() > 0) {
      <span class="cngx-avatar-group__overflow" aria-hidden="true">+{{ hiddenCount() }}</span>
    }
  `,
})
export class CngxAvatarGroup {
  /** Maximum avatars to show before collapsing the rest into the pill. Unset = show all. */
  readonly max = input<number | undefined>(undefined);
  /** Size preset for the overflow pill and stacking overlap (mirrors `CngxAvatar`). */
  readonly size = input<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');
  /** Pill shape (mirrors `CngxAvatar`). */
  readonly shape = input<'circle' | 'square'>('circle');
  /** Entity noun used in the `aria-label` summary. EN default. */
  readonly label = input<string>('avatars');

  private readonly el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private readonly avatars = contentChildren(CngxAvatar);

  /** Total number of projected avatars. */
  protected readonly total = computed(() => this.avatars().length);

  /** How many avatars are actually shown (capped by `max`). */
  protected readonly visibleCount = computed(() => {
    const cap = this.max();
    const count = this.total();
    return cap && cap < count ? cap : count;
  });

  /** How many avatars are collapsed into the `+N` pill. */
  protected readonly hiddenCount = computed(() => this.total() - this.visibleCount());

  /** Accessible summary of total and hidden counts. */
  protected readonly ariaLabel = computed(() => {
    const total = this.total();
    const hidden = this.hiddenCount();
    const noun = this.label();
    return hidden > 0 ? `${total} ${noun}, ${hidden} not shown` : `${total} ${noun}`;
  });

  constructor() {
    // Cap the visible avatars by toggling `hidden` on the overflow hosts. Runs
    // in the render phase and re-runs whenever the count or `max` changes, so
    // the slice stays a pure function of the signal graph.
    afterRenderEffect(() => {
      const visible = this.visibleCount();
      const hosts = this.el.querySelectorAll<HTMLElement>(':scope > cngx-avatar');
      hosts.forEach((host, index) => host.toggleAttribute('hidden', index >= visible));
    });
  }
}
