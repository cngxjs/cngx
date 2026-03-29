import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Banner',
  navLabel: 'Banner',
  navCategory: 'feedback',
  description: 'Global system-level banners for session timeout, maintenance, offline status. Sticky top, always persistent, dedup by id, async action lifecycle.',
  apiComponents: ['CngxBannerOutlet', 'CngxBanner'],
  moduleImports: [
    "import { CngxBanner } from '@cngx/ui/feedback';",
  ],
  setup: `
  private readonly banner = inject(CngxBanner);

  // ── Basic demos ──
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
  }

  // ── Update demo ──
  private countdown = 5;
  private countdownInterval: ReturnType<typeof setInterval> | undefined;

  protected startCountdown(): void {
    this.countdown = 5;
    this.banner.show({
      message: 'Session expires in 5 minutes.',
      id: 'auth:countdown',
      severity: 'warning',
      dismissible: false,
    });
    clearInterval(this.countdownInterval);
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
        this.banner.dismiss('auth:countdown');
      } else {
        this.banner.update('auth:countdown', {
          message: 'Session expires in ' + this.countdown + ' minutes.',
          severity: this.countdown <= 2 ? 'error' : 'warning',
        });
      }
    }, 1000);
  }

  // ── Async action demo ──
  protected showAsyncAction(): void {
    this.banner.show({
      message: 'Payment method expired.',
      id: 'billing:payment',
      severity: 'error',
      action: {
        label: 'Update Payment',
        handler: () => new Promise<void>((resolve, reject) => {
          setTimeout(() => Math.random() > 0.5 ? resolve() : reject(new Error('Card declined')), 2000);
        }),
      },
    });
  }
  `,
  sections: [
    {
      title: 'System Banners',
      subtitle: 'Inject <code>CngxBanner</code> and call <code>.show()</code>. Banners are always persistent — dismiss programmatically via <code>dismiss(id)</code>. <code>role="alert"</code> for error/warning, <code>aria-live="assertive"</code> for error only.',
      template: `
  <div style="display:flex;flex-wrap:wrap;gap:8px">
    <button (click)="showOffline()" class="chip">Offline</button>
    <button (click)="showMaintenance()" class="chip">Maintenance</button>
    <button (click)="showSessionTimeout()" class="chip">Session Timeout (async)</button>
    <button (click)="showNewVersion()" class="chip">New Version</button>
    <button (click)="dismissOffline()" class="chip">Dismiss Offline</button>
    <button (click)="dismissAll()" class="chip">Dismiss All</button>
  </div>`,
    },
    {
      title: 'Dedup + Update',
      subtitle: '<code>id</code> is the dedup key. Calling <code>show()</code> with an existing <code>id</code> updates the message in-place. Great for countdown timers.',
      template: `
  <div style="display:flex;gap:8px;margin-bottom:12px">
    <button (click)="startCountdown()" class="chip">Start Session Countdown</button>
  </div>
  <p style="font-size:0.875rem;color:#64748b">Watch the banner update every second. Severity changes to error at 2 minutes.</p>`,
    },
    {
      title: 'Async Action',
      subtitle: 'When <code>action.handler</code> returns a <code>Promise</code>, the button shows <code>aria-busy</code> and disables during execution. On success: banner dismissed. On error: banner stays open with error message. 50/50 chance.',
      template: `
  <div style="display:flex;gap:8px">
    <button (click)="showAsyncAction()" class="chip">Show Payment Banner (50/50 success)</button>
  </div>`,
    },
  ],
};
