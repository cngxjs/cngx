import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { CngxListbox, CngxListboxTrigger, CngxOption } from '@cngx/common/interactive';
import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';

import { injectPaginatorConfig } from '../paginator-config';
import { CNGX_PAGINATOR_GLYPHS } from '../paginator-glyphs';
import { CNGX_PAGINATOR_HOST } from '../paginator-host.token';

/**
 * Items-per-page segment. A `CngxListbox` dropdown (never a native `<select>`,
 * never the forms select family - keeps `@cngx/ui/paginator` free of a
 * `@cngx/forms` dependency). `[options]` is data, not a feature toggle.
 * Picking a size routes through `host.setPageSize`, which resets to
 * page 0 (brain semantics). The selected size is derived from `host.pageSize()`,
 * so the panel selection and the trigger label never drift (Pillar 1).
 *
 * @category ui/paginator
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/segments/paginator-page-size.component.ts
 * @since 0.1.0
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-parts/page-size/dropdown</example-url>
 */
@Component({
  selector: 'cngx-pgn-page-size',
  exportAs: 'cngxPgnPageSize',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxListbox, CngxListboxTrigger, CngxOption, CngxPopover, CngxPopoverTrigger],
  template: `
    <button
      type="button"
      class="cngx-paginator__button cngx-paginator__select"
      [cngxListboxTrigger]="lb"
      [cngxPopoverTrigger]="pop"
      [haspopup]="'listbox'"
      [popover]="pop"
      [attr.aria-label]="config.ariaLabels.itemsPerPage"
      [disabled]="host.isBusy()"
      (click)="pop.toggle()"
    >
      <span class="cngx-paginator__select-label">{{ host.pageSize() }}</span>
      <span class="cngx-paginator__select-caret" aria-hidden="true">{{ glyphs.caret }}</span>
    </button>
    <div cngxPopover #pop="cngxPopover" [closeOnOutsideClick]="true">
      <ul
        cngxListbox
        class="cngx-paginator__select-panel"
        tabindex="0"
        [label]="config.ariaLabels.itemsPerPage"
        [value]="host.pageSize()"
        (valueChange)="onSelect($event)"
        #lb="cngxListbox"
      >
        @for (option of resolvedOptions(); track option) {
          <li cngxOption class="cngx-paginator__option" [value]="option">{{ option }}</li>
        }
      </ul>
    </div>
  `,
  host: { class: 'cngx-paginator__segment' },
})
export class CngxPaginatorPageSize {
  protected readonly host = inject(CNGX_PAGINATOR_HOST);
  protected readonly config = injectPaginatorConfig();
  protected readonly glyphs = CNGX_PAGINATOR_GLYPHS;

  /**
   * Selectable page sizes. Pure data - the segment is content-agnostic. Leave
   * unbound (or empty) to fall back to the cascade default
   * (`CNGX_PAGINATOR_CONFIG.pageSizeOptions`, set app-wide via
   * `withPaginatorPageSizeOptions`); a non-empty binding wins over it.
   */
  readonly options = input<readonly number[]>([]);

  /**
   * The sizes actually rendered: the per-instance `[options]` when non-empty,
   * otherwise the config cascade default. A pure derivation - no synced state
   * (Pillar 1).
   */
  protected readonly resolvedOptions = computed(() => {
    const instance = this.options();
    return instance.length > 0 ? instance : this.config.pageSizeOptions;
  });

  protected onSelect(value: number | undefined): void {
    if (typeof value === 'number') {
      this.host.setPageSize(value);
    }
  }
}
