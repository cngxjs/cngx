import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild,
  ViewEncapsulation,
  type Signal,
  type TemplateRef,
} from '@angular/core';
import { outputToObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  CNGX_COMMAND_MATCH_FACTORY,
  injectCommands,
  type CngxCommand,
  type CngxCommandGroup,
  type CngxRankedCommand,
} from '@cngx/common/command';
import { CngxListbox, CngxOption, CngxSearch } from '@cngx/common/interactive';
import { CngxHighlight } from '@cngx/common/layout';
import { nextUid, type CngxAsyncState } from '@cngx/core/utils';

import { injectCommandPaletteConfig } from '../config/command-palette-config';
import type {
  CngxCommandGroupHeaderContext,
  CngxCommandPaletteEmptyContext,
  CngxCommandRowContext,
} from '../slots/command-slots';
import { CNGX_COMMAND_PALETTE_HOST } from './panel-host.token';

/**
 * One rendered result group: a header label (null for the ungrouped bucket)
 * plus its ranked commands, in render order. `id` is a panel-unique DOM id
 * minted by the panel (never a raw user string); `slot` is the stable
 * `CngxCommandGroup` handed to the group-header slot template.
 * @internal
 */
interface RenderGroup {
  readonly id: string;
  readonly label: string | null;
  readonly items: readonly CngxRankedCommand[];
  readonly slot: CngxCommandGroup;
}

/**
 * A result group before the panel mints its DOM id: `key` is a namespaced
 * dedupe key (`s:` static registry bucket, `a:` async consumer group), so a
 * static group literally labelled "ungrouped" can never collide with the
 * unlabelled bucket, and async ids can never collide with static labels.
 * `slotId` is the consumer-meaningful id echoed into the header slot context.
 * @internal
 */
interface RawRenderGroup {
  readonly key: string;
  readonly slotId: string;
  readonly label: string | null;
  readonly items: readonly CngxRankedCommand[];
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
  imports: [CngxSearch, CngxListbox, CngxOption, CngxHighlight, NgTemplateOutlet],
  styleUrl: './command-panel.component.css',
  host: { class: 'cngx-command-panel' },
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
        [attr.aria-label]="config.searchPlaceholder"
        [placeholder]="config.searchPlaceholder"
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
      [label]="config.listboxLabel"
      [autoHighlightFirst]="true"
      [externalActivation]="true"
    >
      @for (group of groups(); track group.id) {
        <div role="group" [attr.aria-labelledby]="group.label ? group.id + '-h' : null">
          @if (group.label; as header) {
            <div class="cngx-command-group-header" [id]="group.id + '-h'">
              @if (groupHeaderTpl(); as tpl) {
                <ng-container
                  [ngTemplateOutlet]="tpl"
                  [ngTemplateOutletContext]="{ $implicit: group.slot }"
                />
              } @else {
                {{ header }}
              }
            </div>
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
              @if (rowTpl(); as tpl) {
                <ng-container
                  [ngTemplateOutlet]="tpl"
                  [ngTemplateOutletContext]="{
                    $implicit: entry,
                    term: term(),
                    data: entry.command.data,
                    active: lb.ad.activeValue() === entry.command.id,
                  }"
                />
              } @else {
                <span class="cngx-command-row-label" [cngxHighlight]="term()">{{
                  entry.command.label
                }}</span>
              }
              @if (entry.command.disabledReason; as reason) {
                <!-- Target stays in the DOM whenever a reason exists; only the
                     aria-describedby reference (describedBy) is gated on disabled
                     state, so no referenced node ever appears/disappears mid-interaction. -->
                <span class="cngx-sr-only" [id]="reasonId(entry.command)">{{ reason }}</span>
              }
            </div>
          }
        </div>
      }
    </div>

    @if (resultCount() === 0) {
      @if (emptyTpl(); as tpl) {
        <ng-container [ngTemplateOutlet]="tpl" [ngTemplateOutletContext]="{ term: term() }" />
      } @else {
        <div class="cngx-command-state cngx-command-state--empty">{{ config.emptyLabel }}</div>
      }
    }

    <span class="cngx-sr-only" aria-live="polite">{{ countMessage() }}</span>
  `,
})
export class CngxCommandPanel {
  /** Consumer-derived async result source, merged in with the static registry. */
  readonly results = input<CngxAsyncState<CngxCommandGroup[]> | undefined>(undefined);

  /** Persistent scope; feeds the matcher's scope filter and renders as a chip. */
  readonly scope = model<string | undefined>(undefined);

  /** Debounce for the search input (proxied to `CngxSearch`). */
  readonly debounceMs = input<number>(150);

  /** Resolved row slot template (instance > config > null). Built-in default when null. */
  readonly rowTpl = input<TemplateRef<CngxCommandRowContext> | null>(null);
  /** Resolved group-header slot template. Built-in default when null. */
  readonly groupHeaderTpl = input<TemplateRef<CngxCommandGroupHeaderContext> | null>(null);
  /**
   * Resolved empty slot template. Rendered by the panel itself (below the
   * listbox, input stays mounted) whenever the result count is zero - this
   * covers both the static-registry mode, where the shell has no async state
   * to switch on, and an empty async success.
   */
  readonly emptyTpl = input<TemplateRef<CngxCommandPaletteEmptyContext> | null>(null);

  protected readonly config = injectCommandPaletteConfig();
  protected readonly listboxId = nextUid('cngx-command-listbox');

  private readonly commands = injectCommands();
  private readonly matcher = inject(CNGX_COMMAND_MATCH_FACTORY)();
  private readonly host = inject(CNGX_COMMAND_PALETTE_HOST, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly listbox = viewChild(CngxListbox);
  private readonly search = viewChild(CngxSearch);

  private readonly termState = signal('');
  /** Current debounced search term. Exposed for the consumer's result derivation. */
  readonly term: Signal<string> = this.termState.asReadonly();

  /** Stable dedupe-key to DOM-id map behind {@link domGroupId}. */
  private readonly groupDomIds = new Map<string, string>();
  /** Stable command-id to reason-DOM-id map behind {@link reasonId}. */
  private readonly reasonDomIds = new Map<string, string>();

  /** Grouped, ranked results: consumer async groups first, then the ranked registry. */
  protected readonly groups = computed<readonly RenderGroup[]>(
    () => {
      const ranked = this.matcher(this.commands(), this.term(), this.scope());
      const asyncState = this.results();
      const asyncGroups = asyncState ? toRawGroups(asyncState.data() ?? []) : [];
      const raws = [...asyncGroups, ...groupRanked(ranked)];
      this.pruneDomIds(raws);
      return raws.map((raw) => ({
        id: this.domGroupId(raw.key),
        label: raw.label,
        items: raw.items,
        slot: {
          id: raw.slotId,
          label: raw.label ?? '',
          commands: raw.items.map((entry) => entry.command),
        },
      }));
    },
    { equal: renderGroupsEqual },
  );

  /**
   * Drop id-map entries whose group key / command id left the result set, so
   * the memoized maps stay bounded when a long-lived palette streams rotating
   * async group ids. Ids remain stable while their key is present; a key that
   * leaves and returns simply gets a fresh id.
   */
  private pruneDomIds(raws: readonly RawRenderGroup[]): void {
    const groupKeys = new Set(raws.map((raw) => raw.key));
    for (const key of this.groupDomIds.keys()) {
      if (!groupKeys.has(key)) {
        this.groupDomIds.delete(key);
      }
    }
    const commandIds = new Set(
      raws.flatMap((raw) => raw.items.map((entry) => entry.command.id)),
    );
    for (const key of this.reasonDomIds.keys()) {
      if (!commandIds.has(key)) {
        this.reasonDomIds.delete(key);
      }
    }
  }

  /** Flat ranked list in render order, for count + command lookup. */
  private readonly flatItems = computed<readonly CngxRankedCommand[]>(
    () => this.groups().flatMap((group) => group.items),
    { equal: rankedListEqual },
  );

  /** Number of results across every group. Exposed for the consumer. */
  readonly resultCount = computed<number>(() => this.flatItems().length);

  protected readonly countMessage = computed<string>(() =>
    this.config.resultCount(this.resultCount()),
  );

  /** The command id the user last saw highlighted; `null` after a term reset. */
  private lastHighlightedId: string | null = null;
  /** The AD item registry the highlight bookkeeping last saw (identity). */
  private lastRegistry: unknown = null;

  constructor() {
    // Click on an option routes through the listbox's active-descendant, which
    // emits `activated`; Enter forwards through the same `activateCurrent` path.
    // One subscription runs the matching command for both. externalActivation
    // stops the listbox writing its own value on activation.
    afterNextRender(() => {
      const lb = this.listbox();
      if (lb) {
        outputToObservable(lb.ad.activated)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((value) => this.runById(value));
      }
    });
    // Async groups PREPEND above the static results, and the highlight is
    // index-based - a prepend would silently move it onto a different command.
    // Re-resolve by VALUE whenever the AD item registry changes (the registry,
    // not the data list: options only register during change detection, and
    // the index goes stale exactly when the registry re-orders) so Enter runs
    // the item the user saw; when that item left the result set, reset so
    // autoHighlightFirst re-fires on the fresh list.
    effect(() => {
      const lb = this.listbox();
      if (!lb) {
        return;
      }
      const registry = lb.ad.resolvedItems();
      // Tracked so navigation keeps the bookkeeping current between registry changes.
      const active = lb.ad.activeValue();
      untracked(() => {
        const wanted = this.lastHighlightedId;
        const registryChanged = registry !== this.lastRegistry;
        if (registryChanged && wanted !== null && active !== wanted) {
          if (registry.some((item) => item.value === wanted)) {
            lb.ad.highlightByValue(wanted);
          } else {
            lb.ad.resetHighlight();
          }
        }
        this.lastRegistry = registry;
        const current = lb.ad.activeValue();
        this.lastHighlightedId = typeof current === 'string' ? current : null;
      });
    });
    // The palette dialog keeps its content mounted across close, so term and
    // highlight would leak into the next open. Reset when the host closes;
    // clear() feeds searchChange, which routes through onTerm.
    effect(() => {
      const open = this.host?.isOpen() ?? true;
      if (!open) {
        untracked(() => this.search()?.clear());
      }
    });
  }

  protected onTerm(term: string, lb: CngxListbox): void {
    this.termState.set(term);
    // Reset the highlight so autoHighlightFirst re-fires the top result after a
    // re-rank shrinks the list below the previously active index. The value
    // bookkeeping resets too - a new term means the old highlight is void.
    this.lastHighlightedId = null;
    lb.ad.resetHighlight();
  }

  /** Panel-unique DOM id for a group dedupe key. Stable per key for the panel's lifetime. */
  private domGroupId(key: string): string {
    let id = this.groupDomIds.get(key);
    if (!id) {
      id = `${this.listboxId}-g${this.groupDomIds.size}`;
      this.groupDomIds.set(key, id);
    }
    return id;
  }

  protected onKeydown(event: KeyboardEvent, lb: CngxListbox): void {
    // Never hijack browser/app shortcuts: modified combos pass through
    // untouched - the same guard the nav strategies apply. Without it,
    // Ctrl+ArrowDown in the input would navigate and swallow the event.
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
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
    // Minted, never derived from the raw command id - user strings can carry
    // characters that break DOM ids and aria-describedby references.
    let id = this.reasonDomIds.get(command.id);
    if (!id) {
      id = `${this.listboxId}-reason-${this.reasonDomIds.size}`;
      this.reasonDomIds.set(command.id, id);
    }
    return id;
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
function groupRanked(ranked: readonly CngxRankedCommand[]): RawRenderGroup[] {
  const groups: RawRenderGroup[] = [];
  const index = new Map<string, CngxRankedCommand[]>();
  for (const entry of ranked) {
    const key = entry.command.group ?? '';
    let bucket = index.get(key);
    if (!bucket) {
      bucket = [];
      index.set(key, bucket);
      groups.push({
        key: `s:${key}`,
        slotId: key,
        label: entry.command.group ?? null,
        items: bucket,
      });
    }
    bucket.push(entry);
  }
  return groups;
}

/** @internal Maps consumer async command groups into raw render groups (score 0). */
function toRawGroups(source: readonly CngxCommandGroup[]): RawRenderGroup[] {
  return source.map((group) => ({
    key: `a:${group.id}`,
    slotId: group.id,
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
function rankedListEqual(a: readonly CngxRankedCommand[], b: readonly CngxRankedCommand[]): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  return a.every((entry, i) => entry.command === b[i].command && entry.score === b[i].score);
}
