import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCapsLock: live caps-lock warning',
  subtitle:
    '<code>CngxCapsLock</code> reads <code>getModifierState(\'CapsLock\')</code> on each keystroke, drives a <code>capsOn()</code> signal, and announces the warning once on the off→on edge through the live region. The visible hint is consumer-rendered from <code>capsOn()</code>.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: ['CngxInput', 'CngxCapsLock'],
  moduleImports: ["import { CngxInput, CngxCapsLock } from '@cngx/forms/input';"],
  imports: ['CngxInput', 'CngxCapsLock'],
  template: `  <label for="caps-pw" class="demo-label">Password</label>
  <input
    id="caps-pw"
    cngxInput
    cngxCapsLock
    #caps="cngxCapsLock"
    type="password"
    placeholder="Type with Caps Lock on"
    style="width:100%;max-inline-size:24rem"
  />
  @if (caps.capsOn()) {
    <p class="demo-caps-hint">Caps Lock is on</p>
  }`,
  templateChrome: `<div class="status-row">
      <span class="status-badge">capsOn: {{ caps.capsOn() }}</span>
    </div>`,
};
