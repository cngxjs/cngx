import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Dedup + Update',
  subtitle: '<code>id</code> is the dedup key. Calling <code>show()</code> with an existing <code>id</code> updates the message in-place. Great for countdown timers.',
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
  }`,
  template: `
  <div style="display:flex;gap:8px;margin-bottom:12px">
    <button (click)="startCountdown()" class="chip">Start Session Countdown</button>
  </div>
  <p style="font-size:0.875rem;color:#64748b">Watch the banner update every second. Severity changes to error at 2 minutes.</p>`,
};
