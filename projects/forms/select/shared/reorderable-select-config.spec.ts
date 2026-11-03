import {
  Component,
  Injector,
  runInInjectionContext,
  signal,
  viewChild,
  type TemplateRef,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxReorderableMultiSelect } from '../reorderable-multi-select/reorderable-multi-select.component';

import { CNGX_SELECT_LANGUAGE_EN } from '../i18n/select-language-section';

import { injectReorderableSelectConfig } from './inject-helpers';
import {
  CNGX_REORDERABLE_SELECT_CONFIG,
  CNGX_REORDERABLE_SELECT_DEFAULTS,
  provideReorderableSelectConfig,
  provideReorderableSelectConfigAt,
  resolveReorderableSelectConfig,
  withDefaultDragHandle,
  withReorderAriaLabel,
  withReorderKeyboardModifier,
  withReorderListLabels,
  withReorderStripFreeze,
} from './reorderable-select-config';

describe('resolveReorderableSelectConfig', () => {
  it('returns library defaults when no provider is present', () => {
    TestBed.configureTestingModule({});
    const cfg = TestBed.runInInjectionContext(() =>
      resolveReorderableSelectConfig(),
    );
    expect(cfg.keyboardModifier).toBe(CNGX_REORDERABLE_SELECT_DEFAULTS.keyboardModifier);
    expect(cfg.ariaLabel()).toBe(CNGX_SELECT_LANGUAGE_EN.reorderHint);
    expect(cfg.dragHandle).toBe(CNGX_REORDERABLE_SELECT_DEFAULTS.dragHandle);
    expect(cfg.freezeStripOnCommit).toBe(
      CNGX_REORDERABLE_SELECT_DEFAULTS.freezeStripOnCommit,
    );
  });

  it('applies a single feature app-wide via provideReorderableSelectConfig', () => {
    TestBed.configureTestingModule({
      providers: [provideReorderableSelectConfig(withReorderKeyboardModifier('alt'))],
    });
    const cfg = TestBed.runInInjectionContext(() =>
      resolveReorderableSelectConfig(),
    );
    expect(cfg.keyboardModifier).toBe('alt');
    // Non-overridden keys stay at the library default.
    expect(cfg.ariaLabel()).toBe(CNGX_SELECT_LANGUAGE_EN.reorderHint);
  });

  it('merges multiple features in feature-list order', () => {
    TestBed.configureTestingModule({
      providers: [
        provideReorderableSelectConfig(
          withReorderKeyboardModifier('alt'),
          withReorderAriaLabel('Reorder with Alt + arrows'),
          withReorderStripFreeze(false),
        ),
      ],
    });
    const cfg = TestBed.runInInjectionContext(() =>
      resolveReorderableSelectConfig(),
    );
    expect(cfg.keyboardModifier).toBe('alt');
    expect(cfg.ariaLabel()).toBe('Reorder with Alt + arrows');
    expect(cfg.freezeStripOnCommit).toBe(false);
  });

  it('last feature wins when the same key is overridden twice', () => {
    TestBed.configureTestingModule({
      providers: [
        provideReorderableSelectConfig(
          withReorderKeyboardModifier('alt'),
          withReorderKeyboardModifier('meta'),
        ),
      ],
    });
    const cfg = TestBed.runInInjectionContext(() =>
      resolveReorderableSelectConfig(),
    );
    expect(cfg.keyboardModifier).toBe('meta');
  });

  it('supports component-scoped overrides via provideReorderableSelectConfigAt', () => {
    TestBed.configureTestingModule({
      providers: [...provideReorderableSelectConfigAt(withReorderStripFreeze(false))],
    });
    const injector = TestBed.inject(Injector);
    const cfg = runInInjectionContext(injector, () =>
      resolveReorderableSelectConfig(),
    );
    expect(cfg.freezeStripOnCommit).toBe(false);
  });
});

describe('injectReorderableSelectConfig', () => {
  it('returns the resolved config merged with defaults', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideReorderableSelectConfig(withReorderAriaLabel('Reorder entries'))],
    });
    const cfg = TestBed.runInInjectionContext(() => injectReorderableSelectConfig());
    expect(cfg.ariaLabel()).toBe('Reorder entries');
    expect(cfg.keyboardModifier).toBe(CNGX_REORDERABLE_SELECT_DEFAULTS.keyboardModifier);
  });
});

describe('resolveReorderableSelectConfig - runtime language switch', () => {
  it('follows a Signal of ariaLabel', () => {
    const label = signal('Reorder');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideReorderableSelectConfig(withReorderAriaLabel(label))] });
    const resolved = TestBed.runInInjectionContext(() => resolveReorderableSelectConfig());
    label.set('Neu anordnen');
    expect(resolved.ariaLabel()).toBe('Neu anordnen');
  });

  it('shares one Signal for equal plain labels', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideReorderableSelectConfig(withReorderAriaLabel('Reorder'))] });
    const [a, b] = TestBed.runInInjectionContext(() => [resolveReorderableSelectConfig(), resolveReorderableSelectConfig()]);
    expect(a.ariaLabel).toBe(b.ariaLabel);
  });
});

describe('resolveReorderableSelectConfig - sortable list copy', () => {
  it('defaults every list key to the English section', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const cfg = TestBed.runInInjectionContext(() => resolveReorderableSelectConfig());
    expect(cfg.listLabel()).toBe(CNGX_SELECT_LANGUAGE_EN.reorderListLabel);
    expect(cfg.atStart()).toBe(CNGX_SELECT_LANGUAGE_EN.reorderAtStart);
    expect(cfg.atEnd()).toBe(CNGX_SELECT_LANGUAGE_EN.reorderAtEnd);
    expect(typeof cfg.moveUp()).toBe('function');
    expect(typeof cfg.moveDown()).toBe('function');
  });

  it('keeps no copy snapshot in the library defaults', () => {
    for (const key of ['ariaLabel', 'listLabel', 'atStart', 'atEnd']) {
      expect(key in CNGX_REORDERABLE_SELECT_DEFAULTS).toBe(false);
    }
  });

  it('lets withReorderListLabels replace single keys and keeps the rest', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideReorderableSelectConfig(
          withReorderListLabels({ listLabel: 'Order', moveUp: (label) => `Up ${label}` }),
        ),
      ],
    });
    const cfg = TestBed.runInInjectionContext(() => resolveReorderableSelectConfig());
    expect(cfg.listLabel()).toBe('Order');
    expect(cfg.moveUp()('Red')).toBe('Up Red');
    expect(cfg.atEnd()).toBe(CNGX_SELECT_LANGUAGE_EN.reorderAtEnd);
  });

  it('follows Signal values of the list keys', () => {
    const listLabel = signal('Order');
    const moveDown = signal((label: string) => `Down ${label}`);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideReorderableSelectConfigAt(withReorderListLabels({ listLabel, moveDown }))],
    });
    const cfg = TestBed.runInInjectionContext(() => resolveReorderableSelectConfig());
    listLabel.set('Reihenfolge');
    moveDown.set((label) => `Runter ${label}`);
    expect(cfg.listLabel()).toBe('Reihenfolge');
    expect(cfg.moveDown()('Rot')).toBe('Runter Rot');
  });
});

@Component({
  selector: 'drag-handle-source',
  template: `<ng-template #handle><span class="app-drag-handle"></span></ng-template>`,
})
class DragHandleSource {
  readonly handle = viewChild.required<TemplateRef<void>>('handle');
}

@Component({
  selector: 'drag-handle-host',
  template: `
    <cngx-reorderable-multi-select [label]="'Colour'" [options]="options" [(values)]="values" />
  `,
  imports: [CngxReorderableMultiSelect],
})
class DragHandleHost {
  readonly options = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
  ];
  readonly values = signal<string[]>(['red', 'green']);
}

describe('withDefaultDragHandle reaches a mounted CngxReorderableMultiSelect', () => {
  const roots: HTMLElement[] = [];
  afterEach(() => {
    roots.splice(0).forEach((el) => el.remove());
  });

  // The TemplateRef only exists once a view renders it, so the config is
  // provided through a factory that reads it when the select first injects it.
  function mountWithHandle(useHandle: boolean): HTMLElement {
    const holder: { tpl: TemplateRef<void> | null } = { tpl: null };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CNGX_REORDERABLE_SELECT_CONFIG,
          useFactory: () => (useHandle ? withDefaultDragHandle(holder.tpl).config : {}),
        },
      ],
    });
    const source = TestBed.createComponent(DragHandleSource);
    source.detectChanges();
    holder.tpl = source.componentInstance.handle();
    const fixture = TestBed.createComponent(DragHandleHost);
    roots.push(fixture.nativeElement as HTMLElement);
    document.body.appendChild(fixture.nativeElement as HTMLElement);
    TestBed.flushEffects();
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('writes the dragHandle key', () => {
    const tpl = {} as TemplateRef<void>;
    expect(withDefaultDragHandle(tpl).config.dragHandle).toBe(tpl);
  });

  it('renders the configured glyph in every chip handle', () => {
    expect(mountWithHandle(false).querySelectorAll('.app-drag-handle').length).toBe(0);
    const el = mountWithHandle(true);
    expect(el.querySelectorAll('.cngx-select__chip-handle .app-drag-handle').length).toBe(2);
  });
});

describe('provideReorderableSelectConfigAt merges over the parent config', () => {
  it('keeps the app-wide keys a component scope does not set', () => {
    TestBed.configureTestingModule({
      providers: [
        provideReorderableSelectConfig(
          withReorderAriaLabel('Mit Alt und Pfeiltasten sortieren'),
          withReorderKeyboardModifier('meta'),
        ),
      ],
    });
    const injector = Injector.create({
      providers: provideReorderableSelectConfigAt(withReorderStripFreeze(false)),
      parent: TestBed.inject(Injector),
    });
    const cfg = runInInjectionContext(injector, () => resolveReorderableSelectConfig());
    expect(cfg.freezeStripOnCommit).toBe(false);
    expect(cfg.keyboardModifier).toBe('meta');
    expect(cfg.ariaLabel()).toBe('Mit Alt und Pfeiltasten sortieren');
  });
});
