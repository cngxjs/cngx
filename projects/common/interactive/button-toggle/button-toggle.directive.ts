import { Directive, computed, inject, input } from '@angular/core';
import { CngxRovingItem } from '@cngx/common/a11y';
import { injectActivationGuard } from '@cngx/core/utils';
import { CngxRuntimeError } from '@cngx/utils';

import {
  CNGX_BUTTON_MULTI_TOGGLE_GROUP,
  type CngxButtonMultiToggleGroupContract,
} from './button-multi-toggle-group.token';
import {
  CNGX_BUTTON_TOGGLE_GROUP,
  type CngxButtonToggleGroupContract,
} from './button-toggle-group.token';

/** @internal */
interface SingleResolution<T> {
  readonly mode: 'single';
  readonly group: CngxButtonToggleGroupContract<T>;
}

/** @internal */
interface MultiResolution<T> {
  readonly mode: 'multi';
  readonly group: CngxButtonMultiToggleGroupContract<T>;
}

type ParentResolution<T> = SingleResolution<T> | MultiResolution<T>;

/**
 * One option in a button toggle group. Applies only to `<button>`, so activation and focus come
 * from the element.
 *
 * The leaf reads its mode from the group above it when it is created:
 *
 * - In `CngxButtonToggleGroup` it is a radio: `role="radio"` with `aria-checked`. Click, Space
 *   and Enter set the group `value`, and arrow-key focus selects it.
 * - In `CngxButtonMultiToggleGroup` it stays a native button with `aria-pressed`. Click, Space
 *   and Enter add or remove its value.
 *
 * It throws when neither group is an ancestor ([`CNGX1053`](/error-codes/cngx1053.md)) or both are
 * ([`CNGX1052`](/error-codes/cngx1052.md)).
 *
 * The toggle counts as disabled when its own `disabled` or the group's is set. Its own
 * `disabled` also reaches the host `CngxRovingItem`, so arrow keys skip it. The group's
 * `disabled` does not reach the roving item, since a host directive input cannot be rebound.
 *
 * The effective disabled state renders as `aria-disabled` only, never as the native `disabled`
 * attribute, so a disabled toggle stays focusable and its `[cngxDescribedBy]` reason is reachable
 * by keyboard. The core activation guard (`injectActivationGuard`) swallows click on it, and
 * Space and Enter change nothing. A toggle disabled only by the group is therefore reachable
 * with the arrow keys.
 *
 * Bind `[cngxDescribedBy]` to the id of an element that explains the state, for example why the
 * toggle is disabled. The directive has no template, so you render that element.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/button-toggle/button-toggle.directive.ts
 * @selector button[cngxButtonToggle]
 * @since 0.1.0
 * @relatedTo CngxButtonToggleGroup, CngxButtonMultiToggleGroup, CngxRadio, CngxRovingItem, CngxCheckbox, CngxToggle
 * <example-url>/#/common/interactive/button-toggle/multi-group/basic-multi-filter-toolbar</example-url>
 * <example-url>/#/common/interactive/button-toggle/multi-group/disabled-group-cascade-vs-per-toggle</example-url>
 * <example-url>/#/common/interactive/button-toggle/group/basic-view-switcher</example-url>
 * <example-url>/#/common/interactive/button-toggle/group/disabled-group-cascade-vs-per-toggle</example-url>
 * <example-url>/#/common/interactive/button-toggle/group/vertical-orientation</example-url>
 * @axis level molecule
 */
@Directive({
  selector: 'button[cngxButtonToggle]',
  exportAs: 'cngxButtonToggle',
  standalone: true,
  hostDirectives: [
    {
      directive: CngxRovingItem,
      inputs: ['cngxRovingItemDisabled: disabled'],
    },
  ],
  host: {
    class: 'cngx-button-toggle',
    type: 'button',
    '[attr.role]': 'hostRole()',
    '[attr.aria-checked]': 'ariaChecked()',
    '[attr.aria-pressed]': 'ariaPressed()',
    '[attr.aria-disabled]': 'toggleDisabled() ? "true" : null',
    '[attr.aria-describedby]': 'describedBy()',
    '[class.cngx-button-toggle--checked]': 'toggleChecked()',
    '[class.cngx-button-toggle--disabled]': 'toggleDisabled()',
    '(focus)': 'handleFocus()',
    '(click)': 'handleSelect()',
    '(keydown.space)': 'handleKeydown($event)',
    '(keydown.enter)': 'handleKeydown($event)',
  },
})
export class CngxButtonToggle<T = unknown> {
  private readonly resolved: ParentResolution<T> = resolveParent<T>();

  /**
   * Value this toggle represents (required). A single group checks it while the group `value`
   * is `===` to it. A multi group presses it while its `keyFn` key is selected.
   */
  readonly value = input.required<T>();
  /**
   * Disables this toggle. Disabled by this input or by the group, the toggle sets
   * `aria-disabled`, stays focusable and ignores click and keys. Arrow keys skip a toggle
   * disabled by this input. Default `false`.
   */
  readonly disabled = input<boolean>(false);
  /**
   * Binding `[cngxDescribedBy]`: id of an element that describes the toggle, for example why it
   * is disabled. Written to the host `aria-describedby`. Default `null` omits the attribute.
   */
  readonly describedBy = input<string | null>(null, {
    alias: 'cngxDescribedBy',
  });

  protected readonly toggleChecked = computed(() => {
    if (this.resolved.mode === 'single') {
      return this.resolved.group.value() === this.value();
    }
    return this.resolved.group.isSelected(this.value())();
  });

  protected readonly toggleDisabled = computed(
    () => this.resolved.group.disabled() || this.disabled(),
  );

  constructor() {
    injectActivationGuard(() => this.toggleDisabled());
  }

  // Single leaves are radios in a radiogroup (aria-checked is valid there);
  // multi leaves stay native buttons (implicit role="button" carries
  // aria-pressed). aria-checked is undefined for role="button".
  protected readonly hostRole = computed(() =>
    this.resolved.mode === 'single' ? 'radio' : null,
  );

  protected readonly ariaChecked = computed(() =>
    this.resolved.mode === 'single' ? (this.toggleChecked() ? 'true' : 'false') : null,
  );

  protected readonly ariaPressed = computed(() =>
    this.resolved.mode === 'multi' ? (this.toggleChecked() ? 'true' : 'false') : null,
  );

  // A disabled toggle is focusable, so it still consumes the roving flag; the group refuses the
  // selection. Returning early here would leave the flag set for the next, unrelated focus.
  protected handleFocus(): void {
    if (this.resolved.mode === 'single') {
      this.resolved.group.consumePendingArrowSelect(this.value(), this.toggleDisabled());
    }
  }

  protected handleSelect(): void {
    if (this.toggleDisabled()) {
      return;
    }
    if (this.resolved.mode === 'single') {
      this.resolved.group.value.set(this.value());
      return;
    }
    this.resolved.group.toggle(this.value());
  }

  protected handleKeydown(event: Event): void {
    if (this.toggleDisabled()) {
      return;
    }
    event.preventDefault();
    if (this.resolved.mode === 'single') {
      this.resolved.group.value.set(this.value());
      return;
    }
    this.resolved.group.toggle(this.value());
  }
}

function resolveParent<T>(): ParentResolution<T> {
  const single = inject<CngxButtonToggleGroupContract<T>>(CNGX_BUTTON_TOGGLE_GROUP, {
    optional: true,
  });
  const multi = inject<CngxButtonMultiToggleGroupContract<T>>(CNGX_BUTTON_MULTI_TOGGLE_GROUP, {
    optional: true,
  });
  if (single && multi) {
    throw new CngxRuntimeError(
      'CNGX1052',
      typeof ngDevMode !== 'undefined' &&
        ngDevMode &&
        '[cngxButtonToggle] both a single and a multi toggle group are present in the ' +
          'injector tree. Exactly one is required - single + multi semantics are ' +
          'incompatible.',
    );
  }
  if (single) {
    return { mode: 'single', group: single };
  }
  if (multi) {
    return { mode: 'multi', group: multi };
  }
  throw new CngxRuntimeError(
    'CNGX1053',
    typeof ngDevMode !== 'undefined' &&
      ngDevMode &&
      '[cngxButtonToggle] must be placed inside <cngx-button-toggle-group> or ' +
        '<cngx-button-multi-toggle-group>.',
  );
}
