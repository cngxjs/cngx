import {
  Component,
  provideZonelessChangeDetection,
  signal,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import type { CngxTabHandle } from '../tab-group-host.token';
import type { CngxTabsConfig } from '../tabs-config';
import {
  createTabOverflowTemplateBindings,
  tabOverflowOptionId,
  type CngxTabOverflowTemplateBindings,
} from './overflow-template-cascade';
import {
  CngxTabOverflowItem,
  type CngxTabOverflowItemContext,
} from './tab-overflow-item.directive';
import {
  CngxTabOverflowTrigger,
  type CngxTabOverflowTriggerContext,
} from './tab-overflow-trigger.directive';

@Component({
  standalone: true,
  template: `
    <ng-template #trig let-count>trigger:{{ count }}</ng-template>
    <ng-template #itm let-tab>item:{{ tab.id }}</ng-template>
  `,
})
class TemplateHarness {
  @ViewChild('trig', { static: true })
  trig!: TemplateRef<CngxTabOverflowTriggerContext>;
  @ViewChild('itm', { static: true })
  itm!: TemplateRef<CngxTabOverflowItemContext>;
}

interface FakeHandle {
  readonly id: string;
  readonly disabled: () => boolean;
}

function makeHandle(id: string, disabled = false): CngxTabHandle {
  return {
    id,
    label: () => id,
    disabled: () => disabled,
    errorAggregator: () => null,
  } as unknown as CngxTabHandle;
}

describe('createTabOverflowTemplateBindings', () => {
  let triggerTpl: TemplateRef<CngxTabOverflowTriggerContext>;
  let itemTpl: TemplateRef<CngxTabOverflowItemContext>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(TemplateHarness);
    fixture.detectChanges();
    triggerTpl = fixture.componentInstance.trig;
    itemTpl = fixture.componentInstance.itm;
  });

  function build(
    overrides: Partial<{
      triggerSlot: CngxTabOverflowTrigger | undefined;
      itemSlot: CngxTabOverflowItem | undefined;
      config: CngxTabsConfig;
      tabs: readonly FakeHandle[];
      pickTab: (tab: CngxTabHandle) => void;
    }> = {},
  ): CngxTabOverflowTemplateBindings {
    const tabs = (overrides.tabs ?? [makeHandle('A')]) as readonly CngxTabHandle[];
    return createTabOverflowTemplateBindings({
      triggerSlot: signal(overrides.triggerSlot).asReadonly(),
      itemSlot: signal(overrides.itemSlot).asReadonly(),
      config: overrides.config ?? {},
      hiddenCount: signal(tabs.length).asReadonly(),
      hiddenTabs: signal(tabs).asReadonly(),
      pickTab: overrides.pickTab ?? (() => {}),
    });
  }

  it('per-instance directive wins over config tier', () => {
    const slotDir = { templateRef: triggerTpl } as CngxTabOverflowTrigger;
    const cfgTpl = {} as TemplateRef<CngxTabOverflowTriggerContext>;
    const bindings = build({
      triggerSlot: slotDir,
      config: { templates: { overflowTrigger: cfgTpl } },
    });
    expect(bindings.triggerTemplate()).toBe(triggerTpl);
  });

  it('config tier wins when no per-instance directive is set', () => {
    const bindings = build({
      config: {
        templates: {
          overflowTrigger: triggerTpl,
          overflowItem: itemTpl,
        },
      },
    });
    expect(bindings.triggerTemplate()).toBe(triggerTpl);
    expect(bindings.itemTemplate()).toBe(itemTpl);
  });

  it('returns null when neither tier supplies a template (default-fallback signal)', () => {
    const bindings = build({});
    expect(bindings.triggerTemplate()).toBeNull();
    expect(bindings.itemTemplate()).toBeNull();
  });

  it('triggerContext is structural-equal — stable identity across no-op re-derivations', () => {
    const tabs = [makeHandle('A')] as readonly CngxTabHandle[];
    const hiddenCount = signal(1);
    const hiddenTabs = signal<readonly CngxTabHandle[]>(tabs);
    const bindings = createTabOverflowTemplateBindings({
      triggerSlot: signal<CngxTabOverflowTrigger | undefined>(
        undefined,
      ).asReadonly(),
      itemSlot: signal<CngxTabOverflowItem | undefined>(undefined).asReadonly(),
      config: {},
      hiddenCount: hiddenCount.asReadonly(),
      hiddenTabs: hiddenTabs.asReadonly(),
      pickTab: () => {},
    });
    const ctx1 = bindings.triggerContext();
    // Re-emit `hiddenTabs` with the same reference and re-read count.
    hiddenTabs.set(tabs);
    const ctx2 = bindings.triggerContext();
    // Same reference identity — structural-equal short-circuited.
    expect(ctx2).toBe(ctx1);
  });

  it('buildItemContext invokes pickTab(tab) when context.pick() is called', () => {
    const calls: string[] = [];
    const tab = makeHandle('B', false);
    const bindings = build({ pickTab: (t) => calls.push(t.id) });
    const ctx = bindings.buildItemContext(tab, 2);
    expect(ctx.tab).toBe(tab);
    expect(ctx.$implicit).toBe(tab);
    expect(ctx.index).toBe(2);
    expect(ctx.disabled).toBe(false);
    ctx.pick();
    expect(calls).toEqual(['B']);
  });

  it('buildItemContext.disabled mirrors tab.disabled() at the build moment', () => {
    const tab = makeHandle('C', true);
    const bindings = build({});
    const ctx = bindings.buildItemContext(tab, 0);
    expect(ctx.disabled).toBe(true);
  });

  it('buildItemContext caches per-tab — same context reference returned when disabled+index unchanged', () => {
    const tab = makeHandle('A', false);
    const bindings = build({});
    const ctx1 = bindings.buildItemContext(tab, 0);
    const ctx2 = bindings.buildItemContext(tab, 0);
    expect(ctx2).toBe(ctx1);
    // Cached `pick` closure identity is stable too — important for
    // ngTemplateOutlet not re-binding the embedded view.
    expect(ctx2.pick).toBe(ctx1.pick);
  });

  it('buildItemContext rebuilds when index changes', () => {
    const tab = makeHandle('A', false);
    const bindings = build({});
    const ctx0 = bindings.buildItemContext(tab, 0);
    const ctx5 = bindings.buildItemContext(tab, 5);
    expect(ctx5).not.toBe(ctx0);
    expect(ctx5.index).toBe(5);
  });

  it('buildItemContext rebuilds when disabled flips between calls', () => {
    let isDisabled = false;
    const tab = {
      id: 'A',
      label: () => 'A',
      disabled: () => isDisabled,
      errorAggregator: () => null,
    } as unknown as CngxTabHandle;
    const bindings = build({});
    const ctxEnabled = bindings.buildItemContext(tab, 0);
    isDisabled = true;
    const ctxDisabled = bindings.buildItemContext(tab, 0);
    expect(ctxDisabled).not.toBe(ctxEnabled);
    expect(ctxDisabled.disabled).toBe(true);
  });

  it('tabOverflowOptionId returns a stable suffix per tab id', () => {
    const a = makeHandle('alpha');
    const b = makeHandle('bravo');
    expect(tabOverflowOptionId(a)).toBe('alpha-overflow-option');
    expect(tabOverflowOptionId(b)).toBe('bravo-overflow-option');
    expect(tabOverflowOptionId(a)).not.toBe(tabOverflowOptionId(b));
  });

  it('adItems projects hiddenTabs into ActiveDescendantItem[] with stable ids and disabled flags', () => {
    const tabs = [
      makeHandle('A'),
      makeHandle('B', true),
      makeHandle('C'),
    ] as readonly CngxTabHandle[];
    const bindings = build({ tabs });
    const items = bindings.adItems();
    expect(items.length).toBe(3);
    expect(items[0]).toEqual({
      id: 'A-overflow-option',
      value: tabs[0],
      label: 'A',
      disabled: false,
    });
    expect(items[1].disabled).toBe(true);
    expect(items[1].id).toBe('B-overflow-option');
    expect(items[2].id).toBe('C-overflow-option');
  });

  it('adItems is structural-equal — identity-stable when ids + disabled flags unchanged', () => {
    const tabs = [makeHandle('A'), makeHandle('B')] as readonly CngxTabHandle[];
    const hiddenCount = signal(2);
    const hiddenTabs = signal<readonly CngxTabHandle[]>(tabs);
    const bindings = createTabOverflowTemplateBindings({
      triggerSlot: signal<CngxTabOverflowTrigger | undefined>(
        undefined,
      ).asReadonly(),
      itemSlot: signal<CngxTabOverflowItem | undefined>(undefined).asReadonly(),
      config: {},
      hiddenCount: hiddenCount.asReadonly(),
      hiddenTabs: hiddenTabs.asReadonly(),
      pickTab: () => {},
    });
    const items1 = bindings.adItems();
    // Re-emit hiddenTabs with a fresh array carrying the same handle
    // identities and disabled flags — structural-equal short-circuits.
    hiddenTabs.set([...tabs]);
    const items2 = bindings.adItems();
    expect(items2).toBe(items1);
  });
});

