import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  model,
  signal,
  viewChild,
  ViewEncapsulation,
  type Signal,
} from '@angular/core';

import {
  CNGX_COMMAND_MATCH_FACTORY,
  injectCommands,
  type CngxCommand,
  type CommandGroup,
  type RankedCommand,
} from '@cngx/common/command';
import { CngxListbox, CngxOption, CngxSearch } from '@cngx/common/interactive';
import { CngxHighlight } from '@cngx/common/layout';
import { nextUid, type CngxAsyncState } from '@cngx/core/utils';

import { CNGX_COMMAND_PALETTE_DEFAULTS } from './command-palette-defaults';
import { CNGX_COMMAND_PALETTE_HOST } from './panel-host.token';

/**
 * One rendered result group: a header label (null for the ungrouped bucket)
 * plus its ranked commands, in render order.
 * @internal
 */
interface RenderGroup {
  readonly id: string;
  readonly label: string | null;
  readonly items: readonly RankedCommand[];
}

/**
 * @internal
 * The command-palette result body: a `role=combobox` search input driving a
 * `role=listbox` of ranked commands with `aria-activedescendant`, grouped
 * results, match highlighting, a bound scope chip, and a polite result-count
 * live region. Composes existing atoms - `CngxSearch` (debounced term),
 * `CngxListbox` + `CngxOption` (navigation over the ranked list in final DOM
 * order via the listbox's own `CngxActiveDescendant`), `CngxHighlight` (match
 * marking) - with no reinvented debounce, navigation, or ranking engine.
 *
 * The ranked list is a `computed()` over the `equal`-guarded registry, the
 * swappable matcher, `term`, `scope`, and the consumer's async result source;
 * the per-option `matchFn` never runs, so there is no double-filter.
 */
@Component({
  selector: 'cngx-command-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxSearch, CngxListbox, CngxOption, CngxHighlight],
  template: `
    <div class="cngx-command-panel-input-row">
      @if (scope(); as activeScope) {
        <span class="cngx-command-scope-chip">{{ activeScope }}</span>
      }
      <input
        cngxSearch
        class="cngx-command-panel-input"
        type="text"
        role="combobox"
        autocomplete="off"
        aria-autocomplete="list"
        [attr.aria-expanded]="true"
        [attr.aria-controls]="listboxId"
        [attr.aria-activedescendant]="lb.ad.activeId()"
        [attr.aria-label]="defaults.searchPlaceholder"
        [placeholder]="defaults.searchPlaceholder"
        [debounceMs]="debounceMs()"
        (searchChange)="onTerm($event, lb)"
        (keydown)="onKeydown($event, lb)"
      />
    </div>

    <div
      cngxListbox
      #lb="cngxListbox"
      [id]="listboxId"
      class="cngx-command-panel-listbox"
      [label]="defaults.listboxLabel"
      [autoHighlightFirst]="true"
      [externalActivation]="true"
    >
      @for (group of groups(); track group.id) {
        <div role="group" [attr.aria-labelledby]="group.label ? group.id + '-h' : null">
          @if (group.label; as header) {
            <div class="cngx-command-group-header" [id]="group.id + '-h'">{{ header }}</div>
          }
          @for (entry of group.items; track entry.command.id) {
            <div
              cngxOption
              class="cngx-command-row"
              [value]="entry.command.id"
              [label]="entry.command.label"
              [disabled]="isDisabled(entry.command)"
              [attr.aria-describedby]="describedBy(entry.command)"
            >
              <span class="cngx-command-row-label" [cngxHighlight]="term()">{{
                entry.command.label
              }}</span>
              @if (isDisabled(entry.command) && entry.command.disabledReason; as reason) {
                <span class="cngx-sr-only" [id]="reasonId(entry.command)">{{ reason }}</span>
              }
            </div>
          }
        </div>
      }
    </div>

    <span class="cngx-sr-only" aria-live="polite">{{ countMessage() }}</span>
  `,
})
export class CngxCommandPanel {
  /** Consumer-derived async result source, merged in with the static registry. */
  readonly results = input<CngxAsyncState<CommandGroup[]> | undefined>(undefined);

  /** Persistent scope; feeds the matcher's scope filter and renders as a chip. */
  readonly scope = model<string | undefined>(undefined);

  /** Debounce for the search input (proxied to `CngxSearch`). */
  readonly debounceMs = input<number>(150);

  protected readonly defaults = CNGX_COMMAND_PALETTE_DEFAULTS;
  protected readonly listboxId = nextUid('cngx-command-listbox');

  private readonly commands = injectCommands();
  private readonly matcher = inject(CNGX_COMMAND_MATCH_FACTORY)();
  private readonly host = inject(CNGX_COMMAND_PALETTE_HOST, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly listbox = viewChild.required(CngxListbox);

  private readonly termState = signal('');
  /** Current debounced search term. Exposed for the consumer's result derivation. */
  readonly term: Signal<string> = this.termState.asReadonly();

  /** Grouped, ranked results: consumer async groups first, then the ranked registry. */
  protected readonly groups = computed<readonly RenderGroup[]>(
    () => {
      const ranked = this.matcher(this.commands(), this.term(), this.scope());
      const asyncState = this.results();
      const asyncGroups = asyncState ? toRenderGroups(asyncState.data() ?? []) : [];
      return [...asyncGroups, ...groupRanked(ranked)];
    },
    { equal: renderGroupsEqual },
  );

  /** Flat ranked list in render order, for count + command lookup. */
  private readonly flatItems = computed<readonly RankedCommand[]>(
    () => this.groups().flatMap((group) => group.items),
    { equal: rankedListEqual },
  );

  /** Number of results across every group. Exposed for the consumer. */
  readonly resultCount = computed<number>(() => this.flatItems().length);

  protected readonly countMessage = computed<string>(() =>
    this.defaults.resultCount(this.resultCount()),
  );

  constructor() {
    // Click on an option routes through the listbox's active-descendant, which
    // emits `activated`; Enter forwards through the same `activateCurrent` path.
    // One subscription runs the matching command for both. externalActivation
    // stops the listbox writing its own value on activation.
    afterNextRender(() => {
      const subscription = this.listbox().ad.activated.subscribe((value) => this.runById(value));
      this.destroyRef.onDestroy(() => subscription.unsubscribe());
    });
  }

  protected onTerm(term: string, lb: CngxListbox): void {
    this.termState.set(term);
    // Reset the highlight so autoHighlightFirst re-fires the top result after a
    // re-rank shrinks the list below the previously active index.
    lb.ad.resetHighlight();
  }

  protected onKeydown(event: KeyboardEvent, lb: CngxListbox): void {
    const ad = lb.ad;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        ad.highlightNext();
        return;
      case 'ArrowUp':
        event.preventDefault();
        ad.highlightPrev();
        return;
      case 'Home':
        event.preventDefault();
        ad.highlightFirst();
        return;
      case 'End':
        event.preventDefault();
        ad.highlightLast();
        return;
      case 'Enter':
        if (ad.activeItem()) {
          event.preventDefault();
          ad.activateCurrent();
        }
        return;
    }
    // Space, printable characters, and Backspace fall through to the input so
    // the search term picks them up.
  }

  protected isDisabled(command: CngxCommand): boolean {
    return command.disabled?.() ?? false;
  }

  protected reasonId(command: CngxCommand): string {
    return `${this.listboxId}-reason-${command.id}`;
  }

  protected describedBy(command: CngxCommand): string | null {
    return this.isDisabled(command) && command.disabledReason ? this.reasonId(command) : null;
  }

  private runById(value: unknown): void {
    const command = this.flatItems().find((entry) => entry.command.id === value)?.command;
    if (!command || this.isDisabled(command)) {
      return;
    }
    void command.run();
    this.host?.dismiss();
  }
}

/** @internal Groups ranked results by their `group` key, preserving rank order. */
function groupRanked(ranked: readonly RankedCommand[]): RenderGroup[] {
  const groups: RenderGroup[] = [];
  const index = new Map<string, RankedCommand[]>();
  for (const entry of ranked) {
    const key = entry.command.group ?? '';
    let bucket = index.get(key);
    if (!bucket) {
      bucket = [];
      index.set(key, bucket);
      groups.push({ id: `g-${key || 'ungrouped'}`, label: entry.command.group ?? null, items: bucket });
    }
    bucket.push(entry);
  }
  return groups;
}

/** @internal Maps consumer async command groups into render groups (score 0). */
function toRenderGroups(source: readonly CommandGroup[]): RenderGroup[] {
  return source.map((group) => ({
    id: `a-${group.id}`,
    label: group.label,
    items: group.commands.map((command) => ({ command, score: 0 })),
  }));
}

/** @internal Length + id + per-command identity across groups. */
function renderGroupsEqual(a: readonly RenderGroup[], b: readonly RenderGroup[]): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  return a.every((group, i) => {
    const other = b[i];
    return group.id === other.id && group.label === other.label && rankedListEqual(group.items, other.items);
  });
}

/** @internal Length + per-command identity. */
function rankedListEqual(a: readonly RankedCommand[], b: readonly RankedCommand[]): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  return a.every((entry, i) => entry.command === b[i].command && entry.score === b[i].score);
}
