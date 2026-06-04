import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBanner: dedup update',
  subtitle: '<code>id</code> is the dedup key. Calling <code>show()</code> with an existing <code>id</code> updates the message in-place. Great for countdown timers.',
  description: 'Live-updating banner: a 5-minute session countdown that calls <code>banner.update(id, {...})</code> every second. Message text and severity both mutate in-place because the dedup <code>id</code> stays stable.',
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
  <div class="button-row" style="margin-bottom:12px">
    <button (click)="startCountdown()" class="chip" type="button">Start Session Countdown</button>
  </div>
  <p class="demo-hint">Watch the banner update every second. Severity changes to error at 2 minutes.</p>`,
};
