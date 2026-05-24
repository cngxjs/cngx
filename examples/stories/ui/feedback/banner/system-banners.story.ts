import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBanner: system banners',
  subtitle: 'Inject <code>CngxBanner</code> and call <code>.show()</code>. Banners are always persistent - dismiss programmatically via <code>dismiss(id)</code>. <code>role="alert"</code> for error/warning, <code>aria-live="assertive"</code> for error only.',
  description: 'Variant matrix: offline error, maintenance info, session-timeout warning with sync action, and new-version info with refresh action. Each has its own dedup <code>id</code> so they coexist or replace each other deterministically.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'visual-variants', 'a11y-pattern'],
  references: [
    { label: 'WAI-ARIA APG - Alert', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/' },
  ],
  apiComponents: [
    'CngxBannerOutlet',
    'CngxBanner',
  ],
  moduleImports: [
    'import { CngxBanner, CngxToaster } from \'@cngx/ui/feedback\';',
  ],
  setup: `private readonly banner = inject(CngxBanner);
  private readonly toaster = inject(CngxToaster);
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
      action: {
        label: 'More Info',
        handler: () => {
          this.toaster.show({
            message: 'Maintenance window: 22:00 - 23:30 UTC. Read-only mode during window.',
            severity: 'info',
          });
        },
      },
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
      action: {
        label: 'Refresh',
        handler: () => {
          this.toaster.show({
            message: 'In production: location.reload() would fire here.',
            severity: 'info',
          });
        },
      },
    });
  }
  protected dismissOffline(): void {
    this.banner.dismiss('net:offline');
  }
  protected dismissAll(): void {
    this.banner.dismissAll();
  }`,
  template: `
  <div class="button-row">
    <button (click)="showOffline()" class="chip" type="button">Offline</button>
    <button (click)="showMaintenance()" class="chip" type="button">Maintenance</button>
    <button (click)="showSessionTimeout()" class="chip" type="button">Session Timeout (async)</button>
    <button (click)="showNewVersion()" class="chip" type="button">New Version</button>
    <button (click)="dismissOffline()" class="chip" type="button">Dismiss Offline</button>
    <button (click)="dismissAll()" class="chip" type="button">Dismiss All</button>
  </div>`,
};
