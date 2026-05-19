import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Async Action',
  subtitle: 'When <code>action.handler</code> returns a <code>Promise</code>, the button shows <code>aria-busy</code> and disables during execution. On success: banner dismissed. On error: banner stays open with error message. 50/50 chance.',
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
  }`,
  template: `
  <div style="display:flex;gap:8px">
    <button (click)="showAsyncAction()" class="chip">Show Payment Banner (50/50 success)</button>
  </div>`,
};
