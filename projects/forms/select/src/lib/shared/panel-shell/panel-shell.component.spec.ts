import { Component, signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type AsyncView } from '@cngx/common/data';
import { describe, expect, it, vi } from 'vitest';
import type { CngxSelectCommitErrorDisplay } from '../commit-action.types';
import type { CngxSelectLoadingVariant, CngxSelectRefreshingVariant } from '../config';
import {
  CNGX_SELECT_PANEL_HOST,
  CNGX_SELECT_PANEL_VIEW_HOST,
  type CngxSelectPanelHost,
} from '../panel-host';
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
