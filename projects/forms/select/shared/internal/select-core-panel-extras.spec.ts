import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import type { AsyncView } from '@cngx/common/data';

import type { CngxSelectPanelHostExtras, CngxSelectPanelViewHostExtras } from './select-core';

type OverrideBundle = Pick<
  CngxSelectPanelHostExtras<string>,
  'activeView' | 'showInlineError' | 'isCommitting'
>;
type ViewOverrideBundle = Pick<
  CngxSelectPanelViewHostExtras<string>,
  'activeView' | 'showInlineError' | 'isCommitting'
>;

describe('select core panel-host extras: override keys', () => {
  it('requires every override key and rejects an explicit undefined', () => {
    const full: OverrideBundle = {
      activeView: signal<AsyncView>('content'),
      showInlineError: signal(false),
      isCommitting: signal(false),
    };
    // @ts-expect-error an omitted override key does not compile
    const missing: OverrideBundle = {
      activeView: signal<AsyncView>('content'),
      showInlineError: signal(false),
    };
    const explicitUndefined: ViewOverrideBundle = {
      activeView: signal<AsyncView>('content'),
      showInlineError: signal(false),
      // @ts-expect-error an explicit undefined would silently replace the core signal
      isCommitting: undefined,
    };

    expect(full.isCommitting()).toBe(false);
    expect(missing).toBeDefined();
    expect(explicitUndefined).toBeDefined();
  });
});
