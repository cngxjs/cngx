{{imports}}

@Component({
  selector: '{{selector}}',
  imports: [{{componentImports}}],
  templateUrl: './{{templateFile}}',
  styleUrl: './{{stylesheetFile}}',
})
export class App {
  protected readonly title = signal('{{project}}');
{{#feedback}}

  private readonly toaster = inject(CngxToaster);
  private readonly banner = inject(CngxBanner);
  // The stack brings its own alerter, so the alert needs no root provider.
  private readonly alerts = viewChild.required(CngxAlertStack);

  protected showToast(): void {
    this.toaster.show({ message: 'Saved. This toast came through the toast outlet.', severity: 'success' });
  }

  protected showBanner(): void {
    this.banner.show({ id: 'starter', message: 'A banner stays until someone closes it.', severity: 'info' });
  }

  protected showAlert(): void {
    this.alerts().alerter.show({
      title: 'Heads up',
      message: 'Alerts appear right where you put the stack.',
      severity: 'warning',
      scope: 'starter',
    });
  }
{{/feedback}}
{{#language}}

  protected readonly language = computed(() => (cngxLanguagePack() === CNGX_LANGUAGE_PACKS.de ? 'de' : 'en'));

  protected setLanguage(language: string | undefined): void {
    cngxLanguagePack.set(language === 'de' ? CNGX_LANGUAGE_PACKS.de : CNGX_LANGUAGE_PACKS.en);
  }
{{/language}}
}
