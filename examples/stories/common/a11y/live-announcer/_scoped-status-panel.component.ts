import { ChangeDetectionStrategy, Component, ElementRef, inject, output, signal } from '@angular/core';

import { injectScopedLiveRegion } from '@cngx/common/a11y';

/**
 * Fixture for `scoped-announcing-in-a-modal.story.ts`. The panel creates its
 * polite + assertive live regions inside its own host, so a message sent from
 * inside an `aria-modal` dialog is spoken there instead of from the body
 * regions that VoiceOver drops while the modal is open.
 */
@Component({
  selector: 'demo-scoped-status-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="demo-inline-actions">
      <button type="button" class="chip" (click)="save()">Save draft</button>
      <button type="button" class="chip" (click)="fail()">Simulate failure</button>
      <button type="button" class="chip" (click)="closed.emit()">Close</button>
    </div>
    <p class="demo-scoped-status__last" style="margin:8px 0 0">Last message: {{ last() }}</p>
  `,
})
export class ScopedStatusPanel {
  readonly closed = output<void>();

  private readonly region = injectScopedLiveRegion(inject(ElementRef).nativeElement);
  protected readonly last = signal('none');

  constructor() {
    // Insert both regions with the panel, so the first message does not land
    // in a region that entered the DOM a frame earlier.
    this.region.ensure();
  }

  protected save(): void {
    this.say('Draft saved', 'polite');
  }

  protected fail(): void {
    this.say('Save failed, try again', 'assertive');
  }

  private say(message: string, politeness: 'polite' | 'assertive'): void {
    this.region.announce(message, politeness);
    this.last.set(politeness + ': ' + message);
  }
}
