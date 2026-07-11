import { ChangeDetectionStrategy, Component, computed, signal, ViewEncapsulation } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';

import { CngxMatAccordion } from '@cngx/ui/mat-accordion';

// Re-export forces compodocx to ship app.config.ts in the StackBlitz manifest
// - the only seam for EnvironmentProviders in the playground.
export { appConfig } from './app.config';

/**
 * Mat-accordion bridge - the controlled group model on Material markup.
 *
 * A vanilla `<mat-accordion>` upgraded with one attribute, `cngxMatAccordion`,
 * gaining exactly what Material's own accordion does not expose:
 *
 * - **Controlled `[(openIds)]`.** Expansion is a single `ReadonlySet<string>`
 *   source of truth, not per-panel `[expanded]` bookkeeping. Seed it, read it,
 *   write it - the "collapse all" button just calls `openIds.set(new Set())`.
 * - **Single/multi arbitration.** Flip `[multi]`: in single mode the brain's
 *   `effectiveOpenIds` clamp collapses siblings and `openIds()` holds the last
 *   id; in multi mode every open id stays. Material's own `multi` is pinned
 *   true underneath so it never fights the cngx clamp.
 *
 * Everything visible - headers, ARIA, arrow-key roving between headers - stays
 * Material's. The directive re-renders none of it.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './bridge-example.component.scss',
  imports: [
    MatExpansionModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    CngxMatAccordion,
  ],
  template: `
    <mat-card appearance="outlined" style="max-width: 640px">
      <mat-card-header>
        <mat-card-title>Onboarding steps</mat-card-title>
        <mat-card-subtitle>
          Vanilla &lt;mat-accordion&gt; upgraded with <code>cngxMatAccordion</code>
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <div class="bridge-demo__chrome">
          <mat-button-toggle-group
            [value]="multi() ? 'multi' : 'single'"
            (change)="multi.set($any($event).value === 'multi')"
            aria-label="Open mode"
            hideSingleSelectionIndicator
          >
            <mat-button-toggle value="single">single</mat-button-toggle>
            <mat-button-toggle value="multi">multi</mat-button-toggle>
          </mat-button-toggle-group>

          <button mat-stroked-button type="button" (click)="collapseAll()">Collapse all</button>
        </div>

        <mat-accordion cngxMatAccordion [(openIds)]="openIds" [multi]="multi()">
          <mat-expansion-panel>
            <mat-expansion-panel-header>Personal info</mat-expansion-panel-header>
            <p>Tell us who you are.</p>
          </mat-expansion-panel>

          <mat-expansion-panel>
            <mat-expansion-panel-header>Account</mat-expansion-panel-header>
            <p>Choose your sign-in method.</p>
          </mat-expansion-panel>

          <mat-expansion-panel>
            <mat-expansion-panel-header>Confirm</mat-expansion-panel-header>
            <p>Review everything, then finish.</p>
          </mat-expansion-panel>
        </mat-accordion>

        <p class="bridge-demo__readout">Open panels: {{ openCount() }}</p>
      </mat-card-content>
    </mat-card>
  `,
})
export class AccordionBridgeExample {
  protected readonly multi = signal(false);
  protected readonly openIds = signal<ReadonlySet<string>>(new Set());
  protected readonly openCount = computed(() => this.openIds().size);

  protected collapseAll(): void {
    this.openIds.set(new Set());
  }
}
