import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'System Banners',
  subtitle: 'Inject <code>CngxBanner</code> and call <code>.show()</code>. Banners are always persistent — dismiss programmatically via <code>dismiss(id)</code>. <code>role="alert"</code> for error/warning, <code>aria-live="assertive"</code> for error only.',
  description: 'Global system-level banners for session timeout, maintenance, offline status. Sticky top, always persistent, dedup by id, async action lifecycle.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'visual-variants', 'a11y-pattern'],
  apiComponents: [
    'CngxBannerOutlet',
    'CngxBanner',
  ],
  moduleImports: [
    'import { CngxBanner } from \'@cngx/ui/feedback\';',
  ],
  setup: `private readonly banner = inject(CngxBanner);
  protected showOffline(): void {
    this.banner.show({
      message: 'You are offline. Changes will sync when reconnected.',
      id: 'net:offline',
      severity: 'error',
    });
  }
  protected showMaintenance(): void {
    this.banner.show({
      message: 'Scheduled maintenance tonight at 22:00 UTC.',
      id: 'sys:maintenance',
      severity: 'info',
      action: { label: 'More Info', handler: () => alert('Maintenance details...') },
    });
  }
  protected showSessionTimeout(): void {
    this.banner.show({
      message: 'Your session expires in 5 minutes.',
      id: 'auth:session-timeout',
      severity: 'warning',
      action: {
        label: 'Extend',
        handler: () => new Promise<void>(r => setTimeout(r, 1500)),
      },
    });
  }
  protected showNewVersion(): void {
    this.banner.show({
      message: 'A new version is available.',
      id: 'app:version',
      severity: 'info',
      action: { label: 'Refresh', handler: () => location.reload() },
    });
  }
  protected dismissOffline(): void {
    this.banner.dismiss('net:offline');
  }
  protected dismissAll(): void {
    this.banner.dismissAll();
  }`,
  template: `
  <div style="display:flex;flex-wrap:wrap;gap:8px">
    <button (click)="showOffline()" class="chip">Offline</button>
    <button (click)="showMaintenance()" class="chip">Maintenance</button>
    <button (click)="showSessionTimeout()" class="chip">Session Timeout (async)</button>
    <button (click)="showNewVersion()" class="chip">New Version</button>
    <button (click)="dismissOffline()" class="chip">Dismiss Offline</button>
    <button (click)="dismissAll()" class="chip">Dismiss All</button>
  </div>`,
};
