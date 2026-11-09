import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxAsyncClick } from '@cngx/common/interactive';
import { describe, expect, it } from 'vitest';

import { CngxButton } from './button.component';
import { injectButtonSpinner, provideButtonSpinner } from './button-spinner.token';
import { CngxCloseButton } from './close-button.component';
import { CngxIconButton } from './icon-button.component';

@Component({
  selector: 'demo-dots',
  template: `<span class="demo-dots">...</span>`,
})
class DemoDots {}

@Component({
  selector: 'demo-spinner-scope',
  viewProviders: [provideButtonSpinner(DemoDots)],
  template: `
    <button id="button" cngxButton [cngxAsyncClick]="run" [showDelay]="0" [minDwell]="0">
      Save
    </button>
    <button
      id="icon"
      cngxIconButton
      aria-label="Sync"
      [cngxAsyncClick]="run"
      [showDelay]="0"
      [minDwell]="0"
    ></button>
    <button
      id="close"
      cngxCloseButton
      aria-label="Close"
      [cngxAsyncClick]="run"
      [showDelay]="0"
      [minDwell]="0"
    ></button>
  `,
  imports: [CngxButton, CngxIconButton, CngxCloseButton, CngxAsyncClick],
})
class SpinnerScope {
  readonly pending = signal<(() => void) | null>(null);
  readonly run = (): Promise<void> => new Promise<void>((resolve) => this.pending.set(resolve));
}

@Component({
  template: `
    <demo-spinner-scope />
    <button id="plain" cngxButton [cngxAsyncClick]="run" [showDelay]="0" [minDwell]="0">
      Plain
    </button>
  `,
  imports: [SpinnerScope, CngxButton, CngxAsyncClick],
})
class Host {
  readonly run = (): Promise<void> => new Promise<void>(() => undefined);
}

async function renderBusy() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  for (const id of ['button', 'icon', 'close', 'plain']) {
    (el.querySelector(`#${id}`) as HTMLElement).click();
  }
  fixture.detectChanges();
  TestBed.flushEffects();
  await new Promise((resolve) => setTimeout(resolve));
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  return (id: string) => el.querySelector(`#${id} .cngx-button__busy`) as HTMLElement | null;
}

describe('provideButtonSpinner', () => {
  it('renders the provided glyph in the busy layer of every host in scope', async () => {
    const layer = await renderBusy();
    for (const id of ['button', 'icon', 'close']) {
      expect(layer(id)?.getAttribute('aria-hidden')).toBe('true');
      expect(layer(id)?.querySelector('.demo-dots')).not.toBeNull();
      expect(layer(id)?.querySelector('.cngx-button__spinner')).toBeNull();
    }
  });

  it('keeps the built-in spinner outside the provider scope', async () => {
    const layer = await renderBusy();
    expect(layer('plain')?.querySelector('.cngx-button__spinner')).not.toBeNull();
    expect(layer('plain')?.querySelector('.demo-dots')).toBeNull();
  });

  it('reads null without a provider', () => {
    expect(TestBed.runInInjectionContext(() => injectButtonSpinner())).toBeNull();
  });
});
