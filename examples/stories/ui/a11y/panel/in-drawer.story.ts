import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxA11yPanel: Placed in a drawer',
  subtitle:
    'The panel owns no overlay, so placement is the consumer&apos;s call. Here the same <code>&lt;cngx-a11y-panel /&gt;</code> lives inside a <code>CngxDrawer</code> - the split mirrors <code>CngxListbox</code> under <code>CngxSelect</code>: body here, overlay is the consumer&apos;s.',
  description:
    'Nothing about the panel changes between this demo and the inline one - it is the identical card. Only the wrapper differs. The drawer supplies the slide-in overlay and the trigger; the panel supplies the axis controls. Reset still restores every axis default and announces through the shared live region, and every pick still reflects onto the root attribute app-wide.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxA11yPanel', 'CngxDrawer', 'CngxDrawerPanel'],
  moduleImports: [
    "import { CngxA11yPanel } from '@cngx/ui/a11y';",
    "import { CngxDrawer, CngxDrawerPanel } from '@cngx/common/layout';",
  ],
  imports: ['CngxA11yPanel', 'CngxDrawer', 'CngxDrawerPanel'],
  setup: `protected readonly settingsOpen = signal(false);`,
  template: `<div cngxDrawer #settingsDrawer="cngxDrawer"
     [cngxDrawerOpened]="settingsOpen()"
     (openedChange)="settingsOpen.set($event)"
     style="position:relative;overflow:hidden;min-height:26rem;border:1px solid var(--cngx-color-border, #d4d4d8);border-radius:0.5rem">
  <nav [cngxDrawerPanel]="settingsDrawer" position="right"
       [enabled]="settingsDrawer.opened()"
       aria-label="Accessibility settings"
       style="padding:1rem;background:var(--cngx-color-surface, #fff)">
    <cngx-a11y-panel style="width:22rem;max-width:80vw" />
  </nav>

  <main style="padding:1.5rem">
    <p>Your app content. The accessibility panel slides in from the right.</p>
    <button type="button" class="sort-btn" (click)="settingsDrawer.close()">Close settings</button>
  </main>
</div>`,
  templateChrome: `<div class="button-row">
    <button type="button" class="sort-btn" (click)="settingsOpen.set(!settingsOpen())">
      {{ settingsOpen() ? 'Hide' : 'Open' }} accessibility settings
    </button>
  </div>`,
};
