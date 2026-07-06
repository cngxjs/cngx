import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAccordion: Keyboard navigation',
  subtitle:
    'Header focus roves with the Up / Down arrow keys; Enter or Space toggles the focused panel.',
  description:
    'The accordion pins the <code>CngxRovingTabindex</code> host directive to the vertical axis, so only one header is in the tab order and arrows move between them. Native buttons make Enter / Space activate through the browser.',
  level: 'molecule',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxAccordion', 'CngxAccordionPanel'],
  imports: ['CngxAccordion', 'CngxAccordionPanel'],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion keyboard interaction',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/#keyboardinteraction',
    },
  ],
  setup: `protected readonly items = [
    { key: 'intro', label: 'Introduction', content: 'What this guide covers and who it is for.' },
    { key: 'install', label: 'Installation', content: 'Add the package and import the global theme once.' },
    { key: 'usage', label: 'Usage', content: 'Compose the directives and wire your own skin.' },
  ] as const;`,
  templateChromeBefore: `<p style="margin:0 0 16px;color:var(--cngx-color-text-muted,#666)">
    Tab into the accordion, then use Arrow Up / Down to move between headers and Enter / Space to toggle.
  </p>`,
  template: `  <div cngxAccordion class="cngx-accordion" #acc="cngxAccordion" style="max-width:480px">
    @for (item of items; track item.key) {
      <button cngxAccordionPanel [panelId]="item.key" [controls]="'region-' + item.key">
        {{ item.label }}
      </button>
      <div
        class="cngx-accordion__region"
        role="region"
        [id]="'region-' + item.key"
        [attr.aria-label]="item.label"
        [hidden]="!acc.isOpen(item.key)">
        {{ item.content }}
      </div>
    }
  </div>`,
};
