import { Component, ErrorHandler, signal, type EnvironmentProviders, type Provider, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { expect, vi } from 'vitest';

import { CngxSelectAnnouncer } from '../announcer';
import { CngxSelectOption } from '../../declarative/option.component';
import { CngxSelect } from '../../single-select/select.component';
import { CngxMultiSelect } from '../../multi-select/multi-select.component';
import { CngxCombobox } from '../../combobox/combobox.component';
import { CngxTypeahead } from '../../typeahead/typeahead.component';
import { CngxActionSelect } from '../../action-select/action-select.component';
import { CngxActionMultiSelect } from '../../action-multi-select/action-multi-select.component';
import { CngxTreeSelect } from '../../tree-select/tree-select.component';
import { CngxReorderableMultiSelect } from '../../reorderable-multi-select/reorderable-multi-select.component';
import { CngxSelectShell } from '../../select-shell/select-shell.component';

/**
 * One composite entry for {@link mount}. Ports the independent-review Appendix A
 * harness so the review probes (P5, P7, P12, P13) run verbatim as specs.
 *
 * @internal
 */
export interface Kind {
  readonly name: string;
  readonly component: Type<unknown>;
  readonly selector: string;
  readonly inputs: string;
  readonly model: 'value' | 'values';
  readonly optionSelector: string;
  readonly content?: string;
  readonly contentImports?: readonly Type<unknown>[];
  readonly outputs: readonly string[];
}

const FLAT = { inputs: '[options]="options"', optionSelector: '[cngxOption]' } as const;
const COMMON_OUT = ['selectionChange', 'commitError', 'stateChange', 'openedChange', 'cleared', 'retry'];

/** Every composite the review probes host, keyed by short name. @internal */
export const KINDS: Record<string, Kind> = {
  select: { ...FLAT, name: 'CngxSelect', component: CngxSelect, selector: 'cngx-select', model: 'value', outputs: COMMON_OUT },
  typeahead: { ...FLAT, name: 'CngxTypeahead', component: CngxTypeahead, selector: 'cngx-typeahead', model: 'value', outputs: COMMON_OUT },
  actionSelect: { ...FLAT, name: 'CngxActionSelect', component: CngxActionSelect, selector: 'cngx-action-select', model: 'value', outputs: [...COMMON_OUT, 'created'] },
  shell: {
    name: 'CngxSelectShell', component: CngxSelectShell, selector: 'cngx-select-shell', inputs: '', model: 'value', optionSelector: 'cngx-option', outputs: COMMON_OUT,
    content: `<cngx-option [value]="'red'">Red</cngx-option><cngx-option [value]="'green'">Green</cngx-option><cngx-option [value]="'blue'">Blue</cngx-option>`,
    contentImports: [CngxSelectOption],
  },
  multi: { ...FLAT, name: 'CngxMultiSelect', component: CngxMultiSelect, selector: 'cngx-multi-select', model: 'values', outputs: [...COMMON_OUT, 'optionToggled'] },
  combobox: { ...FLAT, name: 'CngxCombobox', component: CngxCombobox, selector: 'cngx-combobox', model: 'values', outputs: [...COMMON_OUT, 'optionToggled'] },
  actionMulti: { ...FLAT, name: 'CngxActionMultiSelect', component: CngxActionMultiSelect, selector: 'cngx-action-multi-select', model: 'values', outputs: [...COMMON_OUT, 'optionToggled', 'created'] },
  reorder: { ...FLAT, name: 'CngxReorderableMultiSelect', component: CngxReorderableMultiSelect, selector: 'cngx-reorderable-multi-select', model: 'values', outputs: [...COMMON_OUT, 'optionToggled', 'reordered'] },
  tree: {
    name: 'CngxTreeSelect', component: CngxTreeSelect, selector: 'cngx-tree-select',
    inputs: '[nodes]="nodes" [nodeIdFn]="idFn" [labelFn]="labelFn"', model: 'values', optionSelector: '[role="treeitem"]', outputs: COMMON_OUT,
  },
};

/** @internal */
export const OPTIONS = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
];
/** @internal */
export const NODES = [{ value: 'red' }, { value: 'green' }, { value: 'blue' }];

/** Stubs the Popover API jsdom lacks. @internal */
export function polyfillPopover(): void {
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  if (typeof proto['showPopover'] === 'function') {
    return;
  }
  proto['showPopover'] = function (this: HTMLElement) { this.setAttribute('data-popover-open', 'true'); };
  proto['hidePopover'] = function (this: HTMLElement) { this.removeAttribute('data-popover-open'); };
  proto['togglePopover'] = function (this: HTMLElement) {
    const open = !this.hasAttribute('data-popover-open');
    if (open) {
      this.setAttribute('data-popover-open', 'true');
    } else {
      this.removeAttribute('data-popover-open');
    }
    return open;
  };
}

/** @internal */
export function flush(fixture: ComponentFixture<unknown>): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
}

/** @internal */
export interface VariantApi {
  open(): void;
  close(): void;
  panelOpen(): boolean;
  readonly [k: string]: unknown;
}

/** @internal */
export interface Mount {
  fixture: ComponentFixture<unknown>;
  h: ProbeHost;
  el: HTMLElement;
  v: VariantApi;
  settle(): void;
  open(): void;
  rows(): HTMLElement[];
  pickAt(i: number): void;
  clear(): void;
  events: { name: string; payload: unknown }[];
  spoken: { message: string; politeness: string }[];
  errors: unknown[];
  readModel(): unknown;
  destroy(): void;
  kind: Kind;
}

/** @internal */
export interface MountOpts {
  initial?: unknown;
  mode?: 'optimistic' | 'pessimistic';
  commit?: (intended: unknown) => unknown;
  providers?: readonly (Provider | EnvironmentProviders)[];
  extraInputs?: string;
  /** Full override of the component tag (inside the host). */
  template?: string;
  options?: unknown[];
  noCommit?: boolean;
}

/** The host component {@link mount} builds around each composite. @internal */
interface ProbeHost {
  options: ReturnType<typeof signal<unknown[]>>;
  nodes: typeof NODES;
  idFn: (v: unknown) => string;
  labelFn: (v: unknown) => string;
  mode: ReturnType<typeof signal<'optimistic' | 'pessimistic'>>;
  model: ReturnType<typeof signal<unknown>>;
  disabled: ReturnType<typeof signal<boolean>>;
  show: ReturnType<typeof signal<boolean>>;
  createImpl: (term: string) => unknown;
  createFn: (term: string) => unknown;
  lang: ReturnType<typeof signal<string>>;
  impl: (intended: unknown) => unknown;
  calls: unknown[];
  commitAction: (intended: unknown) => unknown;
}

const rec = (x: unknown): Record<string, unknown> => (x ?? {}) as Record<string, unknown>;
const asFn = (x: unknown): ((...a: unknown[]) => unknown) | undefined =>
  typeof x === 'function' ? (x as (...a: unknown[]) => unknown) : undefined;

const attached: HTMLElement[] = [];
/** Removes every root {@link mount} appended to the document. @internal */
export function cleanupRoots(): void {
  attached.splice(0).forEach((e) => e.remove());
}

/** @internal */
export function mount(kind: Kind, o: MountOpts = {}): Mount {
  polyfillPopover();
  const errors: unknown[] = [];
  TestBed.configureTestingModule({
    providers: [
      { provide: ErrorHandler, useValue: { handleError: (e: unknown) => errors.push(e) } },
      ...(o.providers ?? []),
    ],
  });
  const binding = kind.model === 'value' ? '[(value)]="model"' : '[(values)]="model"';
  @Component({ template: '', host: { 'data-probe-host': '' } })
  class Host implements ProbeHost {
    options = signal<unknown[]>(o.options ?? OPTIONS);
    nodes = NODES;
    idFn = (v: unknown): string => String(v);
    labelFn = (v: unknown): string => String(v);
    mode = signal<'optimistic' | 'pessimistic'>(o.mode ?? 'optimistic');
    model = signal<unknown>(o.initial ?? (kind.model === 'value' ? undefined : []));
    disabled = signal(false);
    show = signal(false);
    createImpl: (term: string) => unknown = () => undefined;
    createFn = (term: string): unknown => this.createImpl(term);
    lang = signal('en');
    impl: (intended: unknown) => unknown = o.commit ?? (() => undefined);
    calls: unknown[] = [];
    commitAction = (intended: unknown): unknown => {
      this.calls.push(intended);
      return this.impl(intended);
    };
  }
  const inputsExpr = kind.inputs.replace('[options]="options"', '[options]="options()"');
  const commitAttr = o.noCommit ? '' : '[commitAction]="commitAction"';
  TestBed.overrideComponent(Host, {
    set: {
      template: o.template ?? `
        <button type="button" class="outside-btn">Outside</button>
        <${kind.selector}
          [label]="'Colour'"
          ${inputsExpr}
          ${binding}
          [presentation]="'anchored'"
          [clearable]="true"
          [disabled]="disabled()"
          ${commitAttr}
          [commitMode]="mode()"
          [commitErrorDisplay]="'banner'"
          ${o.extraInputs ?? ''}
        >${kind.content ?? ''}</${kind.selector}>`,
      imports: [kind.component, ...(kind.contentImports ?? [])],
    },
  });
  const fixture = TestBed.createComponent(Host);
  const root = fixture.nativeElement as HTMLElement;
  document.body.appendChild(root);
  attached.push(root);
  fixture.detectChanges();
  flush(fixture as ComponentFixture<unknown>);
  const de = fixture.debugElement.query(By.directive(kind.component));
  const v = de.componentInstance as VariantApi;
  const el = de.nativeElement as HTMLElement;
  const f = fixture as ComponentFixture<unknown>;
  const events: { name: string; payload: unknown }[] = [];
  for (const name of kind.outputs) {
    const out = (v as Record<string, unknown>)[name];
    const subscribe = asFn(rec(out)['subscribe']);
    if (out && subscribe) {
      subscribe.call(out, (payload: unknown) => events.push({ name, payload }));
    }
  }
  const spoken: { message: string; politeness: string }[] = [];
  vi.spyOn(TestBed.inject(CngxSelectAnnouncer), 'announce').mockImplementation(
    (message: string, politeness: 'polite' | 'assertive' = 'polite') => {
      spoken.push({ message, politeness });
    },
  );
  const settle = () => flush(f);
  const open = () => {
    if (!v.panelOpen()) {
      v.open();
    }
    settle();
  };
  const rows = () => Array.from(el.querySelectorAll<HTMLElement>(`.cngx-select__panel ${kind.optionSelector}`));
  const m: Mount = {
    fixture: f, h: fixture.componentInstance, el, v, settle, open, rows, events, spoken, errors, kind,
    pickAt: (i) => {
      open();
      const row = rows()[i];
      if (!row) {
        expect.fail(`no row ${i} (${rows().length} rows) for ${kind.name}`);
      }
      row.click();
      settle();
    },
    clear: () => {
      const t = el.querySelector<HTMLElement>('.cngx-select__clear-target');
      if (!t) {
        expect.fail('no clear target ' + kind.name);
      }
      t.click();
      settle();
    },
    readModel: () => fixture.componentInstance.model(),
    destroy: () => { fixture.destroy(); },
  };
  return m;
}

/** @internal */
export const tick = (ms = 0) => new Promise<void>((r) => setTimeout(r, ms));

/** @internal */
export function summarize(m: Mount): Record<string, unknown> {
  const v = m.v;
  const core = rec(rec(v)['core']);
  return {
    model: m.readModel(),
    comp: m.kind.model === 'value' ? asFn(rec(v)['value'])?.() : asFn(rec(v)['values'])?.(),
    commitState: asFn(rec(rec(v)['commitState'])['status'])?.() ?? asFn(rec(core['commitState'])['status'])?.(),
    toggling: rec(asFn(rec(core)['togglingOption'])?.())['value'] ?? null,
    commitErr: asFn(rec(core)['commitErrorText'])?.() ?? null,
    isCommitting: asFn(rec(v)['isCommitting'])?.(),
    panelOpen: asFn(rec(v)['panelOpen'])?.(),
    events: m.events.map((e) => e.name),
    spoken: m.spoken.map((s) => `${s.politeness}:${s.message}`),
    errors: m.errors.length,
  };
}

/**
 * Probe output, collected in memory. Replaces the harness's file append so the
 * raw-throw and user-facing-string guards stay clean and the helper leaves no
 * on-disk artifact.
 *
 * @internal
 */
export const PROBE_LOG: string[] = [];

/** @internal */
export function log(line: string): void {
  PROBE_LOG.push(line);
}
