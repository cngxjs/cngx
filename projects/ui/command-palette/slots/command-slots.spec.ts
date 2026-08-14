import { Component, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideCommands, type CngxCommand } from '@cngx/common/command';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  provideCommandPaletteConfig,
  withCommandPaletteTemplates,
} from '../config/command-palette-config';
import { CngxCommandPalette } from '../palette/command-palette.component';
import {
  CngxCommandPaletteFooter,
  CngxCommandRow,
  type CngxCommandRowContext,
} from './command-slots';

function cmd(id: string, label: string): CngxCommand {
  return { id, label, run: () => {} };
}

function stubDialogElement(el: HTMLDialogElement): void {
  el.showModal ??= vi.fn(() => el.setAttribute('open', ''));
  el.show ??= vi.fn(() => el.setAttribute('open', ''));
  el.close = vi.fn(() => el.removeAttribute('open'));
  vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({
    transitionDuration: '0s',
  } as unknown as CSSStyleDeclaration);
}

@Component({
  standalone: true,
  imports: [CngxCommandPalette, CngxCommandRow, CngxCommandPaletteFooter],
  template: `
    <cngx-command-palette>
      @if (withRow) {
        <ng-template cngxCommandRow let-entry>
          <span class="custom-row">RUN {{ entry.command.label }}</span>
        </ng-template>
      }
      <ng-template cngxCommandPaletteFooter>
        <span class="custom-footer">custom footer</span>
      </ng-template>
    </cngx-command-palette>
  `,
})
class InstanceHost {
  readonly palette = viewChild.required(CngxCommandPalette);
  withRow = true;
}

// Holds a template captured for the config-level (global) override path.
@Component({
  standalone: true,
  template: `<ng-template #g let-entry><span class="cfg-row">CFG {{ entry.command.label }}</span></ng-template>`,
})
class TemplateHolder {
  readonly tpl = viewChild.required<TemplateRef<CngxCommandRowContext>>('g');
}

function openPalette(fixture: ReturnType<typeof TestBed.createComponent<InstanceHost>>): void {
  fixture.detectChanges();
  TestBed.flushEffects();
  const dialogEl = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
  stubDialogElement(dialogEl);
  fixture.componentInstance.palette().open();
  vi.advanceTimersByTime(16);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
}

describe('command palette slot layer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders the instance *cngxCommandRow over the built-in row', () => {
    TestBed.configureTestingModule({ providers: [provideCommands([cmd('a', 'Alpha')])] });
    const fixture = TestBed.createComponent(InstanceHost);
    openPalette(fixture);

    expect(fixture.nativeElement.querySelector('.custom-row')?.textContent).toContain('RUN Alpha');
    // The built-in label branch is not taken.
    expect(fixture.nativeElement.querySelector('.cngx-command-row-label')).toBeNull();
  });

  it('renders the instance *cngxCommandPaletteFooter over the default legend', () => {
    TestBed.configureTestingModule({ providers: [provideCommands([cmd('a', 'Alpha')])] });
    const fixture = TestBed.createComponent(InstanceHost);
    openPalette(fixture);

    expect(fixture.nativeElement.querySelector('.custom-footer')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.cngx-command-legend')).toBeNull();
  });

  it('renders a CNGX_COMMAND_PALETTE_CONFIG.templates row when no instance slot is present', () => {
    const holder = TestBed.createComponent(TemplateHolder);
    holder.detectChanges();
    const configRow = holder.componentInstance.tpl();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideCommands([cmd('a', 'Alpha')]),
        provideCommandPaletteConfig(withCommandPaletteTemplates({ row: configRow })),
      ],
    });
    const fixture = TestBed.createComponent(InstanceHost);
    fixture.componentInstance.withRow = false;
    openPalette(fixture);

    expect(fixture.nativeElement.querySelector('.cfg-row')?.textContent).toContain('CFG Alpha');
  });

  it('lets an instance slot beat a config template (instance > config)', () => {
    const holder = TestBed.createComponent(TemplateHolder);
    holder.detectChanges();
    const configRow = holder.componentInstance.tpl();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideCommands([cmd('a', 'Alpha')]),
        provideCommandPaletteConfig(withCommandPaletteTemplates({ row: configRow })),
      ],
    });
    const fixture = TestBed.createComponent(InstanceHost);
    openPalette(fixture);

    expect(fixture.nativeElement.querySelector('.custom-row')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.cfg-row')).toBeNull();
  });
});
