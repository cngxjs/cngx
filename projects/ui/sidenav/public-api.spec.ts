import { describe, expect, it } from 'vitest';

import type { ResolvedSidenavMode, SidenavMode } from './public-api';

describe('@cngx/ui/sidenav public API shape', () => {
  it('exports ResolvedSidenavMode as every SidenavMode except auto', () => {
    const resolved: readonly ResolvedSidenavMode[] = ['over', 'push', 'side', 'mini'];
    const declared: readonly SidenavMode[] = ['auto', ...resolved];
    // @ts-expect-error 'auto' is not a resolved mode
    const auto: ResolvedSidenavMode = 'auto';
    expect(declared).toHaveLength(resolved.length + 1);
    expect(auto).toBe('auto');
  });
});
