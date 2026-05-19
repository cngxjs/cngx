import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Theming — CSS Custom Properties',
  subtitle: 'Override <code>--cngx-speak-btn-*</code> variables on a parent element to customize size, color, radius, and animation. Each block below shows a different style.',
  description: 'Ready-made speaker button component that connects to a CngxSpeak directive. Fully themeable via CSS custom properties.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['integration', 'a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxSpeakButton',
    'CngxSpeak',
  ],
  imports: ['CngxSpeak', 'CngxSpeakButton'],
  template: `
  <div style="display: flex; gap: 24px; flex-wrap: wrap;">
    <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
      <span style="font-size: 0.75rem; color: var(--cngx-text-secondary, #666);">Default</span>
      <span [cngxSpeak]="'Default style'" #ttsA="cngxSpeak"></span>
      <cngx-speak-button [speakRef]="ttsA" />
    </div>

    <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
      <span style="font-size: 0.75rem; color: var(--cngx-text-secondary, #666);">Primary</span>
      <span [cngxSpeak]="'Primary color button'" #ttsP="cngxSpeak"></span>
      <cngx-speak-button class="speak-btn-primary" [speakRef]="ttsP" />
    </div>

    <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
      <span style="font-size: 0.75rem; color: var(--cngx-text-secondary, #666);">Round + Large</span>
      <span [cngxSpeak]="'Round large button'" #ttsB="cngxSpeak"></span>
      <cngx-speak-button class="speak-btn-round" [speakRef]="ttsB" />
    </div>

    <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
      <span style="font-size: 0.75rem; color: var(--cngx-text-secondary, #666);">Ghost</span>
      <span [cngxSpeak]="'Ghost style'" #ttsC="cngxSpeak"></span>
      <cngx-speak-button class="speak-btn-ghost" [speakRef]="ttsC" />
    </div>

    <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
      <span style="font-size: 0.75rem; color: var(--cngx-text-secondary, #666);">Dark</span>
      <span [cngxSpeak]="'Dark theme button'" #ttsD="cngxSpeak"></span>
      <cngx-speak-button class="speak-btn-dark" [speakRef]="ttsD" />
    </div>
  </div>

  <pre class="code-block" style="margin-top: 16px; font-size: 0.75rem;"><code>/* Override via class on the element */
cngx-speak-button.round {{ '{' }}
  --cngx-speak-btn-size: 40px;
  --cngx-speak-btn-radius: 50%;
  --cngx-speak-btn-icon-size: 20px;
{{ '}' }}

cngx-speak-button.ghost {{ '{' }}
  --cngx-speak-btn-border-width: 0;
  --cngx-speak-btn-bg: transparent;
{{ '}' }}

cngx-speak-button.dark {{ '{' }}
  --cngx-speak-btn-bg: #333;
  --cngx-speak-btn-color: #fff;
  --cngx-border: #555;
{{ '}' }}</code></pre>

  <pre class="code-block" style="margin-top: 8px; font-size: 0.75rem;"><code>&lt;cngx-speak-button class="round" [speakRef]="tts" /&gt;</code></pre>`,
};
