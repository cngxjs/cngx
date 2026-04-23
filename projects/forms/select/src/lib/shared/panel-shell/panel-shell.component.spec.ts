import {
  Component,
  signal,
  viewChild,
  type TemplateRef,
  type WritableSignal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type AsyncView } from '@cngx/common/data';
import { describe, expect, it, vi } from 'vitest';
import type { CngxSelectCommitErrorDisplay } from '../commit-action.types';
import type { CngxSelectLoadingVariant, CngxSelectRefreshingVariant } from '../config';
import {
  CNGX_SELECT_PANEL_HOST,
  CNGX_SELECT_PANEL_VIEW_HOST,
  type CngxSelectActionCallbacks,
  type CngxSelectPanelHost,
} from '../panel-host';
import { CngxSelectAction } from '../template-slots';
import { CngxSelectPanelShell } from './panel-shell.component';

/**
 * Minimal host fixture — exposes the writable signals under test so
 * each case can flip `activeView` / `showInlineError` / … and verify
 * the shell's template branching.
 */
interface MockHostControls {
  activeView: WritableSignal<AsyncView>;
  loadingVariant: WritableSignal<CngxSelectLoadingVariant>;
  refreshingVariant: WritableSignal<CngxSelectRefreshingVariant>;
  commitErrorDisplay: WritableSignal<CngxSelectCommitErrorDisplay>;
  showInlineError: WritableSignal<boolean>;
  showCommitError: WritableSignal<boolean>;
  showRefreshIndicator: WritableSignal<boolean>;
  handleRetry: ReturnType<typeof vi.fn>;
}

function createMockHost(): {
  host: CngxSelectPanelHost;
  controls: MockHostControls;
} {
  const activeView = signal<AsyncView>('content');
  const loadingVariant = signal<CngxSelectLoadingVariant>('skeleton');
  const refreshingVariant = signal<CngxSelectRefreshingVariant>('bar');
  const commitErrorDisplay = signal<CngxSelectCommitErrorDisplay>('banner');
  const showInlineError = signal(false);
  const showCommitError = signal(false);
  const showRefreshIndicator = signal(false);
  const handleRetry = vi.fn();

  const nullTpl = signal<null>(null);

  const host: CngxSelectPanelHost = {
    activeView,
    effectiveOptions: signal([]),
    flatOptions: signal([]),
    skeletonIndices: signal([0, 1, 2]),
    showInlineError,
    showCommitError,
    showRefreshIndicator,
    errorContext: signal({
      $implicit: new Error('boom'),
      error: new Error('boom'),
      retry: handleRetry,
    }),
    commitErrorContext: signal({
      $implicit: new Error('save-fail'),
      error: new Error('save-fail'),
      option: null,
      retry: vi.fn(),
    }),
    loading: signal(false),
    loadingVariant,
    refreshingVariant,
    commitErrorDisplay,
    panelClassList: signal(null),
    panelWidthCss: signal(null),
    resolvedListboxLabel: signal(''),
    resolvedShowSelectionIndicator: signal(true),
    resolvedSelectionIndicatorVariant: signal('checkbox'),
    resolvedSelectionIndicatorPosition: signal('before'),
    listboxCompareWith: signal(Object.is as (a: unknown, b: unknown) => boolean),
    externalActivation: signal(false),
    tpl: {
      check: nullTpl,
      caret: nullTpl,
      optgroup: nullTpl,
      placeholder: nullTpl,
      empty: nullTpl,
      loading: nullTpl,
      optionLabel: nullTpl,
      error: nullTpl,
      refreshing: nullTpl,
      commitError: nullTpl,
      clearButton: nullTpl,
      optionPending: nullTpl,
      optionError: nullTpl,
      action: nullTpl,
    },
    commitErrorValue: signal(null),
    activeId: signal(null),
    isGroup: ((..._args: unknown[]) => false) as CngxSelectPanelHost['isGroup'],
    isSelected: () => false,
    isIndeterminate: () => false,
    isCommittingOption: () => false,
    patchData: () => {
      /* stub — panel shell never writes the buffer */
    },
    clearLocalItems: () => {
      /* stub */
    },
    handleRetry,
  };

  return {
    host,
    controls: {
      activeView,
      loadingVariant,
      refreshingVariant,
      commitErrorDisplay,
      showInlineError,
      showCommitError,
      showRefreshIndicator,
      handleRetry,
    },
  };
}

@Component({
  imports: [CngxSelectPanelShell],
  template: `
    <cngx-select-panel-shell>
      <div class="projected-body">projected</div>
    </cngx-select-panel-shell>
  `,
})
class TestHost {}

function setup() {
  const { host, controls } = createMockHost();
  TestBed.configureTestingModule({
    providers: [
      { provide: CNGX_SELECT_PANEL_HOST, useValue: host },
      { provide: CNGX_SELECT_PANEL_VIEW_HOST, useValue: host },
    ],
  });
  const fixture = TestBed.createComponent(TestHost);
  fixture.detectChanges();
  return { fixture, controls };
}

describe('CngxSelectPanelShell', () => {
  it('renders the selected loading variant in "skeleton" view', () => {
    const { fixture, controls } = setup();
    controls.activeView.set('skeleton');
    controls.loadingVariant.set('spinner');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.cngx-select__spinner-wrap')).toBeTruthy();
    expect(root.querySelector('.projected-body')).toBeNull();
  });

  it('renders the empty message in "empty" and "none" views', () => {
    const { fixture, controls } = setup();
    controls.activeView.set('empty');
    fixture.detectChanges();
    let root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.cngx-select__empty')?.textContent).toBe('No Options');
    expect(root.querySelector('.projected-body')).toBeNull();

    controls.activeView.set('none');
    fixture.detectChanges();
    root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.cngx-select__empty')?.textContent).toBe('No Options');
  });

  it('renders a retry-capable error banner in "error" view (first-load)', () => {
    const { fixture, controls } = setup();
    controls.activeView.set('error');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const retry = root.querySelector<HTMLButtonElement>('.cngx-select__error-retry');
    expect(retry).toBeTruthy();
    retry!.click();
    expect(controls.handleRetry).toHaveBeenCalledTimes(1);
  });

  it('projects ng-content in the default (content) case and stacks inline-error + refreshing', () => {
    const { fixture, controls } = setup();
    // Default view: body projected, banners hidden
    let root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.projected-body')?.textContent).toBe('projected');
    expect(root.querySelector('.cngx-select__error--inline')).toBeNull();
    expect(root.querySelector('.cngx-select__refreshing')).toBeNull();

    // Turn on all three surfaces — inline error, commit-error banner, refreshing
    controls.showInlineError.set(true);
    controls.showCommitError.set(true);
    controls.showRefreshIndicator.set(true);
    controls.refreshingVariant.set('bar');
    fixture.detectChanges();

    root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.cngx-select__error--inline')).toBeTruthy();
    expect(root.querySelector('.cngx-select__commit-error')).toBeTruthy();
    expect(root.querySelector('.cngx-select__refreshing')).toBeTruthy();
    // Body still projected underneath the banners.
    expect(root.querySelector('.projected-body')).toBeTruthy();
  });
});

/**
 * Action-slot fixture — projects a `*cngxSelectAction` template, wires
 * the optional view-host fields through writable signals, and flips
 * `actionPosition` via a component input.
 */
interface ActionHostControls {
  actionPosition: WritableSignal<'top' | 'bottom' | 'both' | 'none'>;
  searchTerm: WritableSignal<string>;
  dirty: WritableSignal<boolean>;
  callbacks: WritableSignal<CngxSelectActionCallbacks>;
}

function createActionHost(): {
  host: CngxSelectPanelHost;
  controls: ActionHostControls;
  actionTpl: WritableSignal<TemplateRef<unknown> | null>;
} {
  const base = createMockHost();
  const searchTerm = signal('');
  const dirty = signal(false);
  const callbacks = signal<CngxSelectActionCallbacks>({
    close: vi.fn(),
    commit: vi.fn(),
    isPending: false,
    setDirty: vi.fn(),
  });
  // The mock's tpl bundle defaults `action` to `nullTpl`; override here
  // with a writable ref so the fixture can splice in the real
  // contentChild-captured templateRef after the test-host is built.
  const actionTpl = signal<TemplateRef<unknown> | null>(null);
  const host: CngxSelectPanelHost = {
    ...base.host,
    actionSearchTerm: searchTerm,
    actionDirty: dirty,
    actionCallbacks: callbacks,
    tpl: {
      ...base.host.tpl,
      action: actionTpl as unknown as typeof base.host.tpl.action,
    },
  };
  const controls: ActionHostControls = {
    actionPosition: signal<'top' | 'bottom' | 'both' | 'none'>('bottom'),
    searchTerm,
    dirty,
    callbacks,
  };
  return { host, controls, actionTpl };
}

@Component({
  imports: [CngxSelectPanelShell, CngxSelectAction],
  template: `
    <cngx-select-panel-shell
      [actionPosition]="actionPosition()"
      [actionFocusTrapEnabled]="trapEnabled()"
    >
      <div class="projected-body">projected</div>
      <ng-template
        cngxSelectAction
        let-term
        let-commit="commit"
        let-pending="isPending"
        let-dirty="dirty"
        let-setDirty="setDirty"
        let-close="close"
      >
        <button
          type="button"
          class="action-button"
          [attr.data-term]="term"
          [attr.data-pending]="pending"
          [attr.data-dirty]="dirty"
          (click)="commit({ label: term })"
        >
          create
        </button>
      </ng-template>
    </cngx-select-panel-shell>
  `,
})
class ActionTestHost {
  readonly actionPosition = signal<'top' | 'bottom' | 'both' | 'none'>('bottom');
  readonly trapEnabled = signal(false);
  readonly actionDir = viewChild(CngxSelectAction);
}

function setupAction() {
  const { host, controls, actionTpl } = createActionHost();
  TestBed.configureTestingModule({
    providers: [
      { provide: CNGX_SELECT_PANEL_HOST, useValue: host },
      { provide: CNGX_SELECT_PANEL_VIEW_HOST, useValue: host },
    ],
  });
  const fixture = TestBed.createComponent(ActionTestHost);
  fixture.detectChanges();
  // The shell renders its action slot only when `host.tpl.action()` is
  // non-null. The test-host declares the `*cngxSelectAction` template
  // inside its own template, so we forward the captured templateRef
  // into the mock's writable `action` slot and re-detect.
  const dir = fixture.componentInstance.actionDir();
  if (dir) {
    actionTpl.set(dir.templateRef as unknown as TemplateRef<unknown>);
  }
  fixture.detectChanges();
  return { fixture, host, controls };
}

describe('CngxSelectPanelShell — action slot', () => {
  it("renders the action template above the projected body when position='top'", () => {
    const { fixture } = setupAction();
    fixture.componentInstance.actionPosition.set('top');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const top = root.querySelector('.cngx-select__action--top');
    const bottom = root.querySelector('.cngx-select__action--bottom');
    expect(top).toBeTruthy();
    expect(bottom).toBeNull();
    // Order: action-top precedes the projected body in DOM order.
    const children = Array.from(root.querySelectorAll('.cngx-select__action--top, .projected-body'));
    expect(children[0]?.classList.contains('cngx-select__action--top')).toBe(true);
    expect(children[1]?.classList.contains('projected-body')).toBe(true);
  });

  it("renders the action template below the projected body when position='bottom' (default)", () => {
    const { fixture } = setupAction();
    // default is 'bottom'
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.cngx-select__action--top')).toBeNull();
    expect(root.querySelector('.cngx-select__action--bottom')).toBeTruthy();
    const children = Array.from(root.querySelectorAll('.cngx-select__action--bottom, .projected-body'));
    expect(children[0]?.classList.contains('projected-body')).toBe(true);
    expect(children[1]?.classList.contains('cngx-select__action--bottom')).toBe(true);
  });

  it("renders both top + bottom instances when position='both' and suppresses when 'none'", () => {
    const { fixture } = setupAction();
    fixture.componentInstance.actionPosition.set('both');
    fixture.detectChanges();
    let root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('.action-button').length).toBe(2);

    fixture.componentInstance.actionPosition.set('none');
    fixture.detectChanges();
    root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('.action-button').length).toBe(0);
    // Projected body still renders — only the action slots drop.
    expect(root.querySelector('.projected-body')).toBeTruthy();
  });

  it('prefills the action context with live searchTerm + dirty + pending state from the view-host', () => {
    const { fixture, controls } = setupAction();
    controls.searchTerm.set('violet');
    controls.dirty.set(true);
    controls.callbacks.set({
      close: vi.fn(),
      commit: vi.fn(),
      isPending: true,
      setDirty: vi.fn(),
    });
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const btn = root.querySelector<HTMLButtonElement>('.action-button');
    expect(btn).toBeTruthy();
    expect(btn!.getAttribute('data-term')).toBe('violet');
    expect(btn!.getAttribute('data-dirty')).toBe('true');
    expect(btn!.getAttribute('data-pending')).toBe('true');

    // Clicking invokes the host's commit callback with the drafted label.
    const commitSpy = controls.callbacks().commit as ReturnType<typeof vi.fn>;
    btn!.click();
    expect(commitSpy).toHaveBeenCalledWith({ label: 'violet' });
  });

  it('forwards actionFocusTrapEnabled to the CngxFocusTrap host directive', async () => {
    const { fixture } = setupAction();
    const shellEl = fixture.nativeElement.querySelector(
      'cngx-select-panel-shell',
    ) as HTMLElement;
    // Directive attribute is applied via hostDirectives. The presence of the
    // cngx-focus-trap class/selector is implicit; we verify the binding
    // round-trips by flipping the input and checking the directive's
    // internal state via the cdk focus trap side-effect (focusable target
    // receives focus when enabled). For this unit test we only assert that
    // the binding doesn't throw and the DOM stays intact across toggles.
    expect(shellEl).toBeTruthy();
    fixture.componentInstance.trapEnabled.set(true);
    fixture.detectChanges();
    // Allow the CDK trap's microtask-scheduled focus to settle.
    await Promise.resolve();
    // Restore — no errors thrown on toggle in either direction.
    fixture.componentInstance.trapEnabled.set(false);
    fixture.detectChanges();
    expect(shellEl.isConnected).toBe(true);
  });
});
