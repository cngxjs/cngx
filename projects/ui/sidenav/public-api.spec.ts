import { describe, expect, it } from 'vitest';

import type { ResolvedSidenavMode, SidenavMode } from './public-api';

describe('@cngx/ui/sidenav public API shape', () => {
  it('exports ResolvedSidenavMode as every SidenavMode except auto', () => {
    const resolved: readonly ResolvedSidenavMode[] = ['over', 'side'];
    const declared: readonly SidenavMode[] = ['auto', ...resolved];
    // @ts-expect-error 'auto' is not a resolved mode
    const auto: ResolvedSidenavMode = 'auto';
    expect(declared).toHaveLength(resolved.length + 1);
    expect(resolved).not.toContain(auto);
  });

  it('drops push: a hidden side rest replaces it', () => {
    // @ts-expect-error 'push' is no longer a mode
    const push: SidenavMode = 'push';
    expect(push).toBe('push');
  });
});
