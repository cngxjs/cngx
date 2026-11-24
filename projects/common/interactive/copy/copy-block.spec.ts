import { Component, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { provideInteractiveI18n, withInteractiveI18nLabels } from '../i18n/interactive-i18n';
import { CngxCopyBlock } from './copy-block';
import { CngxCopyText } from './copy-text.directive';

@Component({
  template: `<cngx-copy-block
    [value]="'npm i'"
    [buttonLabel]="buttonLabel()"
    [failedLabel]="failedLabel()"
    [failedAnnouncement]="failedAnnouncement()"
    >npm i</cngx-copy-block
  >`,
  imports: [CngxCopyBlock],
})
class Host {
  readonly buttonLabel = signal<string | undefined>(undefined);
  readonly failedLabel = signal<string | undefined>(undefined);
  readonly failedAnnouncement = signal<string | undefined>(undefined);
}

@Component({
  template: `<cngx-copy-block
    [value]="'npm i'"
    [resetDelay]="resetDelay()"
    (didCopy)="copied.push($event)"
    (copyFailed)="failures.push($event)"
    >npm i</cngx-copy-block
  >`,
  imports: [CngxCopyBlock],
})
class ForwardHost {
  readonly resetDelay = signal(2000);
  readonly copied: string[] = [];
  readonly failures: unknown[] = [];
}

const lang = signal<'en' | 'de'>('en');
let writeText: ReturnType<typeof vi.fn>;

// `isolate: false` shares one environment per project and the setup file
// only unstubs `vi.stubGlobal`, so a defineProperty on navigator survives.
const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

function restoreClipboard(): void {
  if (clipboardDescriptor) {
    Object.defineProperty(navigator, 'clipboard', clipboardDescriptor);
  } else {
    delete (navigator as unknown as Record<string, unknown>)['clipboard'];
  }
}

describe('CngxCopyBlock', () => {
  afterEach(restoreClipboard);

  beforeEach(() => {
    vi.useFakeTimers();
    lang.set('en');
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    });
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideInteractiveI18n(
          withInteractiveI18nLabels(
            computed(() =>
              lang() === 'de'
                ? {
                    copy: 'Kopieren',
                    copied: 'Kopiert!',
                    copiedAnnouncement: 'In die Zwischenablage kopiert',
                    copyFailed: 'Kopieren fehlgeschlagen',
                    copyFailedAnnouncement: 'Kopieren fehlgeschlagen (Ansage)',
                  }
                : {},
            ),
          ),
        ),
      ],
    });
  });

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const copyText = fixture.debugElement.query(By.directive(CngxCopyText)).injector.get(CngxCopyText);
    const buttonEl = () => root.querySelector('button')!;
    return {
      fixture,
      copyText,
      buttonEl,
      button: () => buttonEl().textContent!.trim(),
      live: () => root.querySelector('[aria-live="polite"]')!.textContent!.trim(),
    };
  }

  it('renders the button label from the bundle and follows a language flip', () => {
    const { fixture, button } = setup();
    expect(button()).toBe('Copy');

    lang.set('de');
    fixture.detectChanges();
    expect(button()).toBe('Kopieren');
  });

  it('lets a bound buttonLabel win over the bundle', () => {
    const { fixture, button } = setup();
    fixture.componentInstance.buttonLabel.set('Copy command');
    fixture.detectChanges();
    expect(button()).toBe('Copy command');
  });

  it('does not re-announce on a language flip', async () => {
    const { fixture, copyText, live, button } = setup();
    expect(live()).toBe('');

    await copyText.copy();
    fixture.detectChanges();
    expect(live()).toBe('Copied to clipboard');

    lang.set('de');
    fixture.detectChanges();
    expect(live()).toBe('Copied to clipboard');
    expect(button()).toBe('Kopiert!');

    vi.advanceTimersByTime(2000);
    fixture.detectChanges();
    expect(live()).toBe('');

    await copyText.copy();
    fixture.detectChanges();
    expect(live()).toBe('In die Zwischenablage kopiert');
  });

  describe('failed copy', () => {
    async function failCopy(setupResult: ReturnType<typeof setup>): Promise<void> {
      writeText.mockRejectedValueOnce(new Error('denied'));
      await setupResult.copyText.copy();
      setupResult.fixture.detectChanges();
    }

    it('shows the failed label and modifier and announces the failure', async () => {
      const ctx = setup();
      await failCopy(ctx);

      expect(ctx.button()).toBe('Copy failed');
      expect(ctx.buttonEl().classList).toContain('cngx-copy-block__button--failed');
      expect(ctx.buttonEl().classList).not.toContain('cngx-copy-block__button--copied');
      expect(ctx.live()).toBe('Copy failed');
    });

    it('lets bound failure inputs win over the bundle', async () => {
      const ctx = setup();
      ctx.fixture.componentInstance.failedLabel.set('Try again');
      ctx.fixture.componentInstance.failedAnnouncement.set('Clipboard blocked');
      ctx.fixture.detectChanges();
      await failCopy(ctx);

      expect(ctx.button()).toBe('Try again');
      expect(ctx.live()).toBe('Clipboard blocked');
    });

    it('follows a language flip on the label without re-announcing', async () => {
      const ctx = setup();
      await failCopy(ctx);
      expect(ctx.live()).toBe('Copy failed');

      lang.set('de');
      ctx.fixture.detectChanges();
      expect(ctx.button()).toBe('Kopieren fehlgeschlagen');
      expect(ctx.live()).toBe('Copy failed');
    });

    it('switches to the copied state on the next successful copy', async () => {
      const ctx = setup();
      await failCopy(ctx);

      await ctx.copyText.copy();
      ctx.fixture.detectChanges();
      expect(ctx.live()).toBe('Copied to clipboard');
      expect(ctx.buttonEl().classList).toContain('cngx-copy-block__button--copied');
      expect(ctx.buttonEl().classList).not.toContain('cngx-copy-block__button--failed');
    });

    it('returns to idle after resetDelay', async () => {
      const ctx = setup();
      await failCopy(ctx);

      vi.advanceTimersByTime(2000);
      ctx.fixture.detectChanges();
      expect(ctx.button()).toBe('Copy');
      expect(ctx.buttonEl().classList).not.toContain('cngx-copy-block__button--failed');
      expect(ctx.live()).toBe('');
    });
  });

  describe('forwarded copy contract', () => {
    function setupForward() {
      const fixture = TestBed.createComponent(ForwardHost);
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;
      const copyText = fixture.debugElement
        .query(By.directive(CngxCopyText))
        .injector.get(CngxCopyText);
      return {
        fixture,
        host: fixture.componentInstance,
        copyText,
        button: () => root.querySelector('button')!.textContent!.trim(),
      };
    }

    it('emits didCopy with the copied text', async () => {
      const ctx = setupForward();
      await ctx.copyText.copy();
      expect(ctx.host.copied).toEqual(['npm i']);
      expect(ctx.host.failures).toEqual([]);
    });

    it('emits copyFailed with the rejection reason', async () => {
      const ctx = setupForward();
      const reason = new Error('denied');
      writeText.mockRejectedValueOnce(reason);
      await ctx.copyText.copy();
      expect(ctx.host.failures).toEqual([reason]);
      expect(ctx.host.copied).toEqual([]);
    });

    it('emits copyFailed with undefined when the execCommand fallback refuses', async () => {
      // `supported` is read at construction: hide the Clipboard API first.
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      const execDescriptor = Object.getOwnPropertyDescriptor(document, 'execCommand');
      Object.defineProperty(document, 'execCommand', {
        value: () => false,
        writable: true,
        configurable: true,
      });
      try {
        const ctx = setupForward();
        await ctx.copyText.copy();
        expect(ctx.host.failures).toEqual([undefined]);
        expect(ctx.host.copied).toEqual([]);
      } finally {
        if (execDescriptor) {
          Object.defineProperty(document, 'execCommand', execDescriptor);
        } else {
          delete (document as unknown as Record<string, unknown>)['execCommand'];
        }
      }
    });

    it('forwards a bound resetDelay', async () => {
      const ctx = setupForward();
      ctx.host.resetDelay.set(500);
      ctx.fixture.detectChanges();
      writeText.mockRejectedValueOnce(new Error('denied'));
      await ctx.copyText.copy();
      ctx.fixture.detectChanges();

      vi.advanceTimersByTime(499);
      ctx.fixture.detectChanges();
      expect(ctx.button()).toBe('Copy failed');

      vi.advanceTimersByTime(1);
      ctx.fixture.detectChanges();
      expect(ctx.button()).toBe('Copy');
    });

    it('keeps the 2000 ms default when resetDelay is not changed', async () => {
      const ctx = setupForward();
      await ctx.copyText.copy();
      ctx.fixture.detectChanges();

      vi.advanceTimersByTime(1999);
      ctx.fixture.detectChanges();
      expect(ctx.button()).toBe('Copied!');

      vi.advanceTimersByTime(1);
      ctx.fixture.detectChanges();
      expect(ctx.button()).toBe('Copy');
    });
  });
});
