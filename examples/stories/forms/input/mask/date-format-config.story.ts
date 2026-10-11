import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxInputMask: date format config',
  subtitle:
    '<code>withDateFormats</code> adds a date mask for a locale the built-in table lacks. The same entry feeds <code>date:short</code>: its four-digit year group becomes two digits.',
  description:
    "The locale here is <code>tr-TR</code>, which has no built-in entry, so without the config both fields fall back to the <code>en-US</code> slashes. <code>withDateFormats({ 'tr-TR': '00.00.0000' })</code> gives <code>date</code> the dotted mask and <code>date:short</code> the derived <code>00.00.00</code>. A <code>withDateShortFormats</code> entry for the same key wins over the derived short mask. Lookup order: exact locale, bare language key, any same-language locale, then <code>en-US</code>.",
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior', 'integration'],
  apiComponents: ['CngxInputMask'],
  moduleImports: [
    "import { CngxInputMask, provideInputConfigAt, withDateFormats } from '@cngx/forms/input';",
    "import { provideLocaleAt } from '@cngx/core/utils';",
  ],
  imports: ['CngxInputMask'],
  viewProviders: [
    "...provideLocaleAt('tr-TR')",
    "...provideInputConfigAt(withDateFormats({ 'tr-TR': '00.00.0000' }))",
  ],
  template: `<div class="demo-form">
  <div class="demo-field">
    <label class="demo-label" for="due-date">Due date</label>
    <input id="due-date" cngxInputMask="date" #dateMask="cngxInputMask" class="demo-input" />
  </div>
  <div class="demo-field">
    <label class="demo-label" for="due-date-short">Due date (short)</label>
    <input id="due-date-short" cngxInputMask="date:short" #shortMask="cngxInputMask" class="demo-input" />
  </div>
</div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">date</span><span class="event-value">{{ dateMask.currentPattern() }}</span></div>
    <div class="event-row"><span class="event-label">date:short</span><span class="event-value">{{ shortMask.currentPattern() }}</span></div>
  </div>`,
};
