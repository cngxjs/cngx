import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  output,
  viewChild,
  ViewEncapsulation,
  type Signal,
} from '@angular/core';

import type { CngxCommandGroup } from '@cngx/common/command';
import { CngxDialog } from '@cngx/common/dialog';
import { parseKeyCombo, type CngxAsyncState } from '@cngx/core/utils';

import { injectCommandPaletteConfig } from '../config/command-palette-config';
import { CngxCommandPanel } from '../panel/command-panel.component';
import { CngxCommandPanelShell } from '../panel/command-panel-shell.component';
import { CNGX_COMMAND_PALETTE_HOST, type CngxCommandPaletteHost } from '../panel/panel-host.token';
import {
  CngxCommandGroupHeader,
  CngxCommandPaletteEmpty,
  CngxCommandPaletteError,
  CngxCommandPaletteFooter,
  CngxCommandPaletteLoading,
  CngxCommandRow,
} from '../slots/command-slots';
import { CNGX_PALETTE_KEYBINDING_FACTORY } from './palette-keybinding';

/**
 * The opinionated Cmd/Ctrl+K command palette preset. Renders the panel body +
 * async-state shell inside a native modal `<dialog cngxDialog>`, so focus
 * trapping, trigger storage at open, and focus restore after the close
 * transition are handled by `CngxDialog` and the platform - no hand-rolled
 * focus machinery. The palette provides `CNGX_COMMAND_PALETTE_HOST` so the
 * panel can dismiss it when a command runs.
 *
 * Type-to-filter runs over the merged command registry (`injectCommands`) plus
 * the consumer's async `[results]`; the palette commits no form value - it
 * fires `command.run()`, the locked demarcation from `CngxCombobox`. The global
 * Cmd/Ctrl+K open combo is wired by the keybinding factory, not here.
 *
 * ```html
 * <cngx-command-palette #palette [results]="results()" />
 * <button [cngxCommandPaletteTrigger]="palette">Search commands</button>
 * ```
 *
 * @category ui/command-palette
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/command-palette/palette/command-palette.component.ts
 * @selector cngx-command-palette
 * @since 0.1.0
 * @relatedTo CngxCommandPaletteTrigger, provideCommands, CngxDialog
 */
@Component({
  selector: 'cngx-command-palette',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxDialog, CngxCommandPanelShell, CngxCommandPanel, NgTemplateOutlet],
  providers: [{ provide: CNGX_COMMAND_PALETTE_HOST, useExisting: CngxCommandPalette }],
  styleUrl: './command-palette.component.css',
  template: `
    <dialog
      cngxDialog
      #dialog="cngxDialog"
      class="cngx-command-palette"
      [attr.aria-label]="ariaLabel()"
    >
      <cngx-command-panel-shell
        [results]="results()"
        [loadingTpl]="loadingTpl()"
        [errorTpl]="errorTpl()"
        (retry)="retry.emit()"
      >
        <cngx-command-panel
          [results]="results()"
          [(scope)]="scope"
          [debounceMs]="debounceMs()"
          [rowTpl]="rowTpl()"
          [groupHeaderTpl]="groupHeaderTpl()"
          [emptyTpl]="emptyTpl()"
        />
      </cngx-command-panel-shell>
      <footer class="cngx-command-footer">
        @if (footerTpl(); as tpl) {
          <ng-container [ngTemplateOutlet]="tpl" [ngTemplateOutletContext]="{}" />
        } @else {
          @for (entry of config.footerLegend; track entry.label) {
            <span class="cngx-command-legend"><kbd>{{ entry.keys }}</kbd> {{ entry.label }}</span>
          }
        }
      </footer>
    </dialog>
  `,
})
export class CngxCommandPalette implements CngxCommandPaletteHost {
  /** Consumer-derived async result source. */
  readonly results = input<CngxAsyncState<CngxCommandGroup[]> | undefined>(undefined);

  /** Two-way scope; feeds the matcher's scope filter and the panel chip. */
  readonly scope = model<string | undefined>(undefined);

  /** Debounce for the search input. */
  readonly debounceMs = input<number>(150);

  /** Accessible name for the dialog. */
  readonly ariaLabel = input<string>('Command palette');

  /**
   * Per-instance open combo (parsed via `parseKeyCombo`, e.g. `'mod+shift+p'`).
   * Wins over `CNGX_COMMAND_PALETTE_CONFIG.openShortcut` (`withPaletteShortcut`),
   * which wins over the `'mod+k'` default. Changing it live re-installs the
   * listener. For a full listener swap, override `CNGX_PALETTE_KEYBINDING_FACTORY`.
   */
  readonly openShortcut = input<string | undefined>(undefined);

  /** Fired when the user asks to retry a failed result load. */
  readonly retry = output<void>();

  protected readonly config = injectCommandPaletteConfig();

  // Instance slot directives (content-projected). contentChild must be a direct
  // field initializer (AOT NG8110). Each resolves instance > config > null.
  private readonly rowSlot = contentChild(CngxCommandRow);
  private readonly groupHeaderSlot = contentChild(CngxCommandGroupHeader);
  private readonly emptySlot = contentChild(CngxCommandPaletteEmpty);
  private readonly loadingSlot = contentChild(CngxCommandPaletteLoading);
  private readonly errorSlot = contentChild(CngxCommandPaletteError);
  private readonly footerSlot = contentChild(CngxCommandPaletteFooter);

  protected readonly rowTpl = computed(
    () => this.rowSlot()?.templateRef ?? this.config.templates?.row ?? null,
  );
  protected readonly groupHeaderTpl = computed(
    () => this.groupHeaderSlot()?.templateRef ?? this.config.templates?.groupHeader ?? null,
  );
  protected readonly emptyTpl = computed(
    () => this.emptySlot()?.templateRef ?? this.config.templates?.empty ?? null,
  );
  protected readonly loadingTpl = computed(
    () => this.loadingSlot()?.templateRef ?? this.config.templates?.loading ?? null,
  );
  protected readonly errorTpl = computed(
    () => this.errorSlot()?.templateRef ?? this.config.templates?.error ?? null,
  );
  protected readonly footerTpl = computed(
    () => this.footerSlot()?.templateRef ?? this.config.templates?.footer ?? null,
  );

  private readonly dialog = viewChild(CngxDialog);

  /** Whether the palette is open. Part of the {@link CngxCommandPaletteHost} contract. */
  readonly isOpen: Signal<boolean> = computed(
    () => (this.dialog()?.lifecycle() ?? 'closed') !== 'closed',
  );

  /** Resolved open combo: instance input > config > `'mod+k'` default. */
  private readonly resolvedShortcut = computed(
    () => this.openShortcut() ?? this.config.openShortcut,
  );

  constructor() {
    // The swappable factory installs the global open combo and calls back to
    // open the palette. The effect re-installs the listener whenever the
    // resolved combo changes; onCleanup tears down the previous listener (and
    // the last one on destroy), so nothing leaks document-wide.
    const factory = inject(CNGX_PALETTE_KEYBINDING_FACTORY);
    effect((onCleanup) => {
      const keybinding = factory(parseKeyCombo(this.resolvedShortcut()), () => this.open());
      onCleanup(() => keybinding.teardown());
    });
  }

  /** Open the palette. */
  open(): void {
    this.dialog()?.open();
  }

  /** Dismiss the palette. Focus returns to the trigger via `CngxDialog`. */
  dismiss(): void {
    this.dialog()?.dismiss();
  }
}
