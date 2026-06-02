import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: stripe-status-rich skin (vertical)',
  subtitle:
    'Numbered disc + status pill anchored to the trailing edge of each row. <code>[orientation]="\'vertical\'"</code> rebases the layout from column-stack-per-step to a row-per-step sidebar list. Pill labels remain decorative; AT semantics come from <code>aria-current</code> + <code>data-state</code>.',
  description:
    'Vertical companion to the horizontal stripe-status-rich demo. Each row stacks indicator + label + status pill horizontally; the pill auto-pushes to the trailing edge via flex margin so the row reads as a checkbox-style status list. The German pill labels stay overridden via <code>provideStepperI18nAt(withStepperI18nLabels(...))</code> in <code>viewProviders</code>; the i18n cascade verification carries over from the horizontal twin.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern', 'composition'],
  apiComponents: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  moduleImports: [
    "import { CngxStep, CngxStepContent, provideStepperI18n, withStepperI18nLabels } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  viewProviders: [
    `provideStepperI18n(
      withStepperI18nLabels({
        statusLabels: {
          done: 'Erledigt',
          inProgress: 'Aktiv',
          upNext: 'Folgt',
          errored: 'Fehler',
        },
      }),
    )`,
  ],
  setup: `protected readonly active = signal(1);`,
  setupChrome: `  protected handleNext(): void {
    this.active.update(i => Math.min(i + 1, 3));
  }
  protected handlePrev(): void {
    this.active.update(i => Math.max(i - 1, 0));
  }`,
  template: `  <cngx-stepper [(activeStepIndex)]="active" skin="stripe-status-rich" [orientation]="'vertical'" aria-label="Auftrag">
    <div cngxStep label="Kunde">
      <ng-template cngxStepContent>
        <p>Kundendaten erfassen - Name, E-Mail, Lieferadresse.</p>
      </ng-template>
    </div>
    <div cngxStep label="Zahlung">
      <ng-template cngxStepContent>
        <p>Zahlungsart wählen und Rechnungsadresse bestätigen.</p>
      </ng-template>
    </div>
    <div cngxStep label="Versand">
      <ng-template cngxStepContent>
        <p>Versandoption wählen.</p>
      </ng-template>
    </div>
    <div cngxStep label="Bestätigen">
      <ng-template cngxStepContent>
        <p>Bestellung prüfen und abschicken.</p>
      </ng-template>
    </div>
  </cngx-stepper>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row">
      <button type="button" class="chip" (click)="handlePrev()">Zurück</button>
      <button type="button" class="chip" (click)="handleNext()">Weiter</button>
    </div>
    <div class="event-row"><span class="event-label">Aktiver Schritt</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
