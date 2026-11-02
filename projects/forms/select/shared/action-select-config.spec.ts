import { Component, Injector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CngxPopover } from '@cngx/common/popover';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxActionSelect } from '../action-select/action-select.component';
import { CngxSelectAction } from './template-slots';

import { injectActionSelectConfig } from './inject-helpers';
import {
  CNGX_ACTION_SELECT_DEFAULTS,
  provideActionSelectConfig,
  provideActionSelectConfigAt,
  resolveActionSelectConfig,
  withActionAriaLabel,
  withActionPopoverPlacement,
  withActionPosition,
  withFocusTrapBehavior,
  withLiveInputFallback,
  type CngxActionSelectConfig,
  type CngxActionSelectConfigFeature,
} from './action-select-config';

describe('provideActionSelectConfig', () => {
  it('falls back to library defaults (focusTrapBehavior: dirty, ariaLabel: Inline action) when nothing is provided', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const resolved = TestBed.runInInjectionContext(() =>
      resolveActionSelectConfig(),
    );
    expect(resolved.focusTrapBehavior).toBe('dirty');
    expect(resolved.ariaLabel()).toBe('Inline action');
  });

  it('keeps no ariaLabel copy snapshot in the library defaults', () => {
    expect('ariaLabel' in CNGX_ACTION_SELECT_DEFAULTS).toBe(false);
  });

  it('merges withFocusTrapBehavior + withActionAriaLabel app-wide', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideActionSelectConfig(
          withFocusTrapBehavior('always'),
          withActionAriaLabel('Quick action'),
        ),
      ],
    });
    const resolved = TestBed.runInInjectionContext(() =>
      resolveActionSelectConfig(),
    );
    expect(resolved.focusTrapBehavior).toBe('always');
    expect(resolved.ariaLabel()).toBe('Quick action');
  });

  it('honours provideActionSelectConfigAt in component-scoped providers', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ...provideActionSelectConfigAt(withFocusTrapBehavior('never')),
      ],
    });
    const injector = TestBed.inject(Injector);
    const resolved = runInInjectionContext(injector, () =>
      resolveActionSelectConfig(),
    );
    expect(resolved.focusTrapBehavior).toBe('never');
    // Unspecified keys still fall back to library defaults.
    expect(resolved.ariaLabel()).toBe('Inline action');
  });
});

describe('injectActionSelectConfig', () => {
  it('returns the resolved config merged with defaults', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideActionSelectConfig(withActionAriaLabel('Quick action'))],
    });
    const resolved = TestBed.runInInjectionContext(() => injectActionSelectConfig());
    expect(resolved.ariaLabel()).toBe('Quick action');
    expect(resolved.focusTrapBehavior).toBe('dirty');
  });
});

describe('resolveActionSelectConfig - runtime language switch', () => {
  it('follows a Signal of ariaLabel', () => {
    const label = signal('Reorder');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideActionSelectConfig(withActionAriaLabel(label))] });
    const resolved = TestBed.runInInjectionContext(() => resolveActionSelectConfig());
    label.set('Neu anordnen');
    expect(resolved.ariaLabel()).toBe('Neu anordnen');
  });

  it('shares one Signal for equal plain labels', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideActionSelectConfig(withActionAriaLabel('Reorder'))] });
    const [a, b] = TestBed.runInInjectionContext(() => [resolveActionSelectConfig(), resolveActionSelectConfig()]);
    expect(a.ariaLabel).toBe(b.ariaLabel);
  });
});

// jsdom has no Popover API.
function polyfillPopover(): void {
  const proto = HTMLElement.prototype as unknown as {
    showPopover?: () => void;
    hidePopover?: () => void;
    togglePopover?: () => boolean;
  };
  if (typeof proto.showPopover === 'function') {
    return;
  }
  proto.showPopover = function (this: HTMLElement) {
    this.setAttribute('data-popover-open', 'true');
  };
  proto.hidePopover = function (this: HTMLElement) {
    this.removeAttribute('data-popover-open');
  };
  proto.togglePopover = function (this: HTMLElement) {
    const open = !this.hasAttribute('data-popover-open');
    if (open) {
      this.setAttribute('data-popover-open', 'true');
    } else {
      this.removeAttribute('data-popover-open');
    }
    return open;
  };
}

@Component({
  selector: 'action-feature-host',
  template: `
    <cngx-action-select [label]="'Colour'" [options]="options" [(value)]="value">
      <ng-template cngxSelectAction>
        <button type="button" class="quick-add">Add</button>
      </ng-template>
    </cngx-action-select>
  `,
  imports: [CngxActionSelect, CngxSelectAction],
})
class ActionFeatureHost {
  readonly options = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
  ];
  readonly value = signal<string | undefined>(undefined);
}

interface ActionFeatureRow {
  readonly name: string;
  readonly feature: CngxActionSelectConfigFeature;
  readonly key: keyof CngxActionSelectConfig;
  readonly value: unknown;
  /** Observes the mounted action select; the result must differ between the runs. */
  readonly observe: (el: HTMLElement, cmp: CngxActionSelect<string>, popover: CngxPopover) => unknown;
  readonly withFeature: unknown;
  readonly withoutFeature: unknown;
}

const ACTION_FEATURE_ROWS: readonly ActionFeatureRow[] = [
  {
    name: 'withActionPosition',
    feature: withActionPosition('top'),
    key: 'actionPosition',
    value: 'top',
    observe: (el) => {
      const action = el.querySelector('.cngx-select__action');
      return action?.classList.contains('cngx-select__action--top') ?? null;
    },
    withFeature: true,
    withoutFeature: false,
  },
  {
    name: 'withLiveInputFallback',
    feature: withLiveInputFallback(false),
    key: 'liveInputFallback',
    value: false,
    observe: (_el, cmp) => cmp.liveInputFallback(),
    withFeature: false,
    withoutFeature: true,
  },
  {
    name: 'withActionPopoverPlacement',
    feature: withActionPopoverPlacement('top-start'),
    key: 'popoverPlacement',
    value: 'top-start',
    observe: (_el, _cmp, popover) => popover.placement(),
    withFeature: 'top-start',
    withoutFeature: 'bottom',
  },
];

describe('every action select config feature reaches a mounted CngxActionSelect', () => {
  const roots: HTMLElement[] = [];
  afterEach(() => {
    roots.splice(0).forEach((el) => el.remove());
  });

  function observeWith(row: ActionFeatureRow, features: CngxActionSelectConfigFeature[]): unknown {
    TestBed.resetTestingModule();
    polyfillPopover();
    TestBed.configureTestingModule({ providers: [provideActionSelectConfig(...features)] });
    const fixture = TestBed.createComponent(ActionFeatureHost);
    roots.push(fixture.nativeElement as HTMLElement);
    document.body.appendChild(fixture.nativeElement as HTMLElement);
    const flush = (): void => {
      TestBed.flushEffects();
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();
    };
    flush();
    const de = fixture.debugElement.query(By.directive(CngxActionSelect));
    const cmp = de.componentInstance as CngxActionSelect<string>;
    cmp.open();
    flush();
    const popover = fixture.debugElement.query(By.directive(CngxPopover)).injector.get(CngxPopover);
    return row.observe(de.nativeElement as HTMLElement, cmp, popover);
  }

  it.each(ACTION_FEATURE_ROWS)('$name writes its key', (row) => {
    expect(row.feature.config[row.key]).toEqual(row.value);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideActionSelectConfig(row.feature)] });
    const resolved = TestBed.runInInjectionContext(() => resolveActionSelectConfig());
    expect(resolved[row.key as keyof typeof resolved]).toEqual(row.value);
  });

  it.each(ACTION_FEATURE_ROWS)('$name changes what the composite renders', (row) => {
    expect(row.withFeature).not.toEqual(row.withoutFeature);
    expect(observeWith(row, [])).toEqual(row.withoutFeature);
    expect(observeWith(row, [row.feature])).toEqual(row.withFeature);
  });
});

describe('provideActionSelectConfigAt merges over the parent config', () => {
  it('keeps the app-wide keys a component scope does not set', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideActionSelectConfig(withActionAriaLabel('Schnellaktion'), withFocusTrapBehavior('always')),
      ],
    });
    const injector = Injector.create({
      providers: provideActionSelectConfigAt(withFocusTrapBehavior('never')),
      parent: TestBed.inject(Injector),
    });
    const resolved = runInInjectionContext(injector, () => resolveActionSelectConfig());
    expect(resolved.focusTrapBehavior).toBe('never');
    expect(resolved.ariaLabel()).toBe('Schnellaktion');
  });
});
