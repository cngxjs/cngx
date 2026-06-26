import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { CngxListbox, CngxOption } from '@cngx/common/interactive';

/**
 * Two listboxes, one signal. `CngxListbox.value` is a `model()`, so
 * `[(value)]="pick"` two-way binds both boxes to the SAME `WritableSignal`.
 * Pick in either and the other follows - they never talk to each other, both
 * views simply derive from one source (Ableitung statt Verwaltung). No
 * `cngx-form-field` and no field bridge are involved; syncing two listboxes is
 * a `CngxListbox` capability, not a forms concern.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxListbox, CngxOption],
  styles: `
    .demo {
      display: grid;
      gap: 18px;
      max-width: 520px;
      padding: 16px;
      font: 14px/1.4 system-ui, sans-serif;
    }
    .demo .lead {
      margin: 0;
      opacity: 0.7;
      font-size: 13px;
    }
    .demo .lead code {
      font-family: ui-monospace, monospace;
    }
    .demo .boxes {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      align-items: start;
    }
    .demo .cap {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
    }
    .demo .listbox {
      display: grid;
      gap: 2px;
      padding: 4px;
      border: 1px solid #b0b0b0;
      border-radius: 6px;
    }
    .demo .listbox:focus-visible {
      outline: 2px solid #1a56c4;
      outline-offset: 1px;
    }
    .demo .option {
      padding: 6px 10px;
      border-radius: 4px;
      cursor: pointer;
    }
    .demo .option:hover {
      background: #eef2ff;
    }
    .demo .option[aria-selected='true'] {
      background: #1a56c4;
      color: #fff;
    }
    .demo .shared {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 3px 14px;
      padding: 10px 12px;
      border-radius: 6px;
      background: #f4f6fb;
      font: 12px/1.5 ui-monospace, monospace;
    }
    .demo .shared dt {
      margin: 0;
      opacity: 0.6;
    }
    .demo .shared dd {
      margin: 0;
      font-weight: 600;
      color: #1a56c4;
    }
  `,
  template: `
    <div class="demo">
      <p class="lead">
        Two listboxes bound to one signal via <code>[(value)]="pick"</code>. Pick in
        either - the other follows. Both views derive from one source; nothing syncs them directly.
      </p>

      <div class="boxes">
        <div>
          <span class="cap">Listbox A</span>
          <div cngxListbox [(value)]="pick" [label]="'Size A'" tabindex="0" class="listbox">
            <div cngxOption value="s" class="option">Small</div>
            <div cngxOption value="m" class="option">Medium</div>
            <div cngxOption value="l" class="option">Large</div>
            <div cngxOption value="xl" class="option">X-Large</div>
          </div>
        </div>

        <div>
          <span class="cap">Listbox B (synced)</span>
          <div cngxListbox [(value)]="pick" [label]="'Size B'" tabindex="0" class="listbox">
            <div cngxOption value="s" class="option">Small</div>
            <div cngxOption value="m" class="option">Medium</div>
            <div cngxOption value="l" class="option">Large</div>
            <div cngxOption value="xl" class="option">X-Large</div>
          </div>
        </div>
      </div>

      <dl class="shared">
        <dt>shared pick()</dt><dd>{{ pick() ?? '—' }}</dd>
      </dl>
    </div>
  `,
})
export class SyncedListboxesExample {
  // The single source both listboxes two-way bind to.
  protected readonly pick = signal<string | undefined>(undefined);
}
