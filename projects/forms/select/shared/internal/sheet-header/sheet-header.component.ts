import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { CngxSwipeDismiss } from '@cngx/common/interactive';
import {
  CngxPopoverSheet,
  CngxPopoverSheetHandle,
  CngxPopoverSheetHeader,
  CngxPopoverSheetTitle,
} from '@cngx/common/popover';
import { CNGX_FORM_FIELD_HOST } from '@cngx/core/tokens';

import { CNGX_SELECT_SHEET_HEADER_HOST } from '../../sheet-header-host';
import type { CngxSelectSheetHandleContext } from '../../template-slots';
import { CNGX_SELECT_GLYPHS } from '../glyphs';
import { createListboxKeyForward } from '../listbox-key-forward';
import { CngxSelectSheetSearchFocus } from './sheet-search-focus.directive';

/**
 * @internal
 *
 * Header of a select-family panel while it is presented as a mobile sheet:
 * decorative handle, the field label as the dialog title, Done, X and, on
 * the input variants, a header input that drives the listbox. First child
 * of the variant's `cngxPopover` element; hidden while anchored.
 *
 * The heading reads the field label once per open (no observer):
 * `[sheetLabel]` → field label → `[label]` → `ariaLabels.fieldLabelFallback`.
 */
@Component({
  selector: 'cngx-select-sheet-header',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    CngxSwipeDismiss,
    CngxPopoverSheetHandle,
    CngxPopoverSheetTitle,
    CngxSelectSheetSearchFocus,
  ],
  hostDirectives: [CngxPopoverSheetHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'cngx-select-sheet-header' },
  templateUrl: './sheet-header.component.html',
  styleUrls: ['./sheet-header.component.css'],
})
export class CngxSelectSheetHeader {
  protected readonly host = inject(CNGX_SELECT_SHEET_HEADER_HOST);
  protected readonly sheet = inject(CngxPopoverSheet);
  private readonly fieldHost = inject(CNGX_FORM_FIELD_HOST, { optional: true });
  private readonly doc = inject(DOCUMENT);

  private readonly swipe = viewChild(CngxSwipeDismiss);
  private readonly title = viewChild.required(CngxPopoverSheetTitle);

  protected readonly closeGlyph = CNGX_SELECT_GLYPHS.clear;

  // Read once per open: the label text is not observed, a closed panel
  // reads nothing.
  private readonly fieldLabel = computed(() => {
    if (!this.host.panelVisible()) {
      return '';
    }
    return untracked(() => {
      const id = this.fieldHost?.labelId?.();
      return id ? (this.doc.getElementById(id)?.textContent?.trim() ?? '') : '';
    });
  });

  protected readonly heading = computed(
    () =>
      this.host.sheetLabel() ??
      (this.fieldLabel() || this.host.label() || this.host.ariaLabels().fieldLabelFallback),
  );

  protected readonly titleId = computed(() => this.title().id());

  protected readonly activeId = computed(() => this.host.listboxRef()?.ad.activeId() ?? null);

  protected readonly closeDisabled = computed(() => (this.host.closeBlocked() ? 'true' : null));

  protected readonly handleContext = computed<CngxSelectSheetHandleContext>(
    () => {
      const presentation = this.host.presentation();
      return { $implicit: presentation, presentation, dragging: this.swipe()?.swiping() ?? false };
    },
    { equal: (a, b) => a.presentation === b.presentation && a.dragging === b.dragging },
  );

  protected readonly handleKeydown = createListboxKeyForward(this.host.listboxRef, () =>
    this.host.escapeClose(),
  );

  protected handleInput(event: Event): void {
    this.host.setSearchTerm((event.target as HTMLInputElement).value);
  }

  protected handleClose(): void {
    if (this.host.closeBlocked()) {
      return;
    }
    this.host.close();
  }
}
