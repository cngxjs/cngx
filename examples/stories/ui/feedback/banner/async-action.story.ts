import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBanner: async action',
  subtitle: 'When <code>action.handler</code> returns a <code>Promise</code>, the button shows <code>aria-busy</code> and disables during execution. On success: banner dismissed. On error: banner stays open with error message. 50/50 chance.',
  description: 'Async action lifecycle: a payment-expired banner whose Update button kicks off a Promise. The handler returns 50/50, so both resolved (auto-dismiss) and rejected (error reason persists in-banner) branches are reachable.',
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
  <div class="button-row">
    <button (click)="showAsyncAction()" class="chip" type="button">Show Payment Banner (50/50 success)</button>
  </div>`,
};
