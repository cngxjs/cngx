import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Accordion panel: Media',
  subtitle:
    'A panel body can hold an <code>&lt;img&gt;</code> with a caption via <code>&lt;figure&gt;</code>/<code>&lt;figcaption&gt;</code>. The accordion folds the media away until the reader asks for it.',
  description:
    'Same disclosure chrome, an image body. The <code>&lt;img&gt;</code> keeps its own <code>alt</code> text and the caption lives in a <code>&lt;figcaption&gt;</code>; the accordion projects the figure untouched.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition'],
  apiComponents: ['CngxAccordionGroup', 'CngxAccordionItem'],
  imports: ['CngxAccordionGroup', 'CngxAccordionItem', 'CngxAccordionItemTitle'],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    },
  ],
  template: `  <cngx-accordion-group [headingLevel]="3" style="max-width:520px">
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Floor plan</span>
      <figure style="margin:0">
        <img
          src="https://picsum.photos/id/1048/480/280"
          alt="Overhead view of the second-floor layout"
          width="480"
          height="280"
          style="width:100%; height:auto; border-radius:8px; display:block"
        />
        <figcaption style="margin-top:.5rem; font-size:.85rem; color:var(--cngx-color-text-muted, #6b7280)">
          Second floor, drawn to a 1:100 scale.
        </figcaption>
      </figure>
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Site photo</span>
      <figure style="margin:0">
        <img
          src="https://picsum.photos/id/1015/480/280"
          alt="Exterior photo of the building from the street"
          width="480"
          height="280"
          style="width:100%; height:auto; border-radius:8px; display:block"
        />
        <figcaption style="margin-top:.5rem; font-size:.85rem; color:var(--cngx-color-text-muted, #6b7280)">
          Street-facing elevation, taken in daylight.
        </figcaption>
      </figure>
    </cngx-accordion-item>
  </cngx-accordion-group>`,
};
