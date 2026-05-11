import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CNGX_STATEFUL } from '@cngx/core/utils';
import { Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { CngxChipInput } from './chip-input.directive';

@Component({
  template: `
    <input
      cngxChipInput
      [existingTokens]="tokens()"
      [allowDuplicates]="allowDup()"
      [trimWhitespace]="trim()"
      [validateToken]="validator() ?? undefined"
      (tokenCreated)="onCreated($event)"
      (tokenRemoved)="removed.set(removed() + 1)"
      (validationError)="errors.set([...errors(), $event])"
    />
  `,
  imports: [CngxChipInput],
})
class Host {
  tokens = signal<readonly string[]>([]);
  allowDup = signal(false);
  trim = signal(true);
  validator = signal<((v: string) => Promise<string>) | null>(null);
  removed = signal(0);
  errors = signal<unknown[]>([]);
  created = signal<string[]>([]);

  onCreated(value: string): void {
    this.created.set([...this.created(), value]);
    this.tokens.set([...this.tokens(), value]);
  }
}

function makePasteEvent(text: string): Event {
  // jsdom implements neither ClipboardEvent nor DataTransfer; build a
  // generic Event with `type: 'paste'` and attach a minimal
  // clipboardData shim with the only method the directive reads.
  const event = new Event('paste', { cancelable: true, bubbles: true });
  Object.defineProperty(event, 'clipboardData', {
    value: { getData: (_type: string) => text },
  });
  return event;
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const de = fixture.debugElement.query(By.directive(CngxChipInput));
  return {
    fixture,
    host: fixture.componentInstance,
    dir: de.injector.get(CngxChipInput),
    el: de.nativeElement as HTMLInputElement,
    de,
  };
}

describe('CngxChipInput', () => {
  it('emits tokenCreated on Enter and clears the input', () => {
    const { fixture, host, el } = setup();
    el.value = 'red';
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    fixture.detectChanges();
    expect(host.created()).toEqual(['red']);
    expect(el.value).toBe('');
  });

  it('emits tokenCreated on comma separator', () => {
    const { fixture, host, el } = setup();
    el.value = 'green';
    el.dispatchEvent(new KeyboardEvent('keydown', { key: ',', cancelable: true }));
    fixture.detectChanges();
    expect(host.created()).toEqual(['green']);
  });

  it('trims whitespace by default', () => {
    const { fixture, host, el } = setup();
    el.value = '  blue  ';
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(host.created()).toEqual(['blue']);
  });

  it('rejects duplicates from existingTokens when allowDuplicates is false', () => {
    const { fixture, host, el } = setup();
    host.tokens.set(['red']);
    fixture.detectChanges();
    el.value = 'red';
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(host.created()).toEqual([]);
  });

  it('accepts duplicates when allowDuplicates is true', () => {
    const { fixture, host, el } = setup();
    host.tokens.set(['red']);
    host.allowDup.set(true);
    fixture.detectChanges();
    el.value = 'red';
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(host.created()).toEqual(['red']);
  });

  it('emits tokenRemoved on Backspace at empty input', () => {
    const { fixture, host, el } = setup();
    el.value = '';
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
    fixture.detectChanges();
    expect(host.removed()).toBe(1);
  });

  it('does NOT emit tokenRemoved on Backspace when input has content', () => {
    const { fixture, host, el } = setup();
    el.value = 'partial';
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
    fixture.detectChanges();
    expect(host.removed()).toBe(0);
  });

  it('paste with multiple comma-separated tokens emits one tokenCreated per fragment', () => {
    const { fixture, host, el } = setup();
    el.dispatchEvent(makePasteEvent('red, green, blue'));
    fixture.detectChanges();
    expect(host.created()).toEqual(['red', 'green', 'blue']);
  });

  it('escapeForCharClass handles dash separator inside paste-split character class', () => {
    @Component({
      template: `<input cngxChipInput [separators]="seps" (tokenCreated)="created.set([...created(), $event])" />`,
      imports: [CngxChipInput],
    })
    class DashHost {
      seps: readonly string[] = ['-', 'Enter'];
      created = signal<string[]>([]);
    }
    const fix2 = TestBed.createComponent(DashHost);
    fix2.detectChanges();
    const el2 = fix2.debugElement.query(By.directive(CngxChipInput))
      .nativeElement as HTMLInputElement;
    el2.dispatchEvent(makePasteEvent('red-green-blue'));
    fix2.detectChanges();
    expect(fix2.componentInstance.created()).toEqual(['red', 'green', 'blue']);
  });

  it('provides CNGX_STATEFUL via useExisting (validation slot is auto-discoverable)', () => {
    const { dir, de } = setup();
    expect(de.injector.get(CNGX_STATEFUL)).toBe(dir);
  });

  it('aria-busy and aria-invalid reflect state.status() reactively', () => {
    const { fixture, host, el, dir } = setup();
    expect(el.getAttribute('aria-busy')).toBeNull();
    expect(el.getAttribute('aria-invalid')).toBeNull();

    host.validator.set(
      () => new Promise<string>(() => undefined /* never resolves */),
    );
    fixture.detectChanges();

    el.value = 'in-flight';
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(el.getAttribute('aria-busy')).toBe('true');
    expect(dir.state.status()).toBe('pending');
  });

  it('validation success path: state goes pending -> success and tokenCreated emits the accepted value', async () => {
    const { fixture, host, el, dir } = setup();
    host.validator.set(async (v) => v.toUpperCase());
    fixture.detectChanges();
    el.value = 'green';
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(dir.state.status()).toBe('success');
    expect(host.created()).toEqual(['GREEN']);
  });

  it('validation error path: state goes pending -> error and validationError emits', async () => {
    const { fixture, host, el, dir } = setup();
    const failure = new Error('rejected');
    host.validator.set(() => Promise.reject(failure));
    fixture.detectChanges();
    el.value = 'bad';
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(dir.state.status()).toBe('error');
    expect(host.errors()).toEqual([failure]);
    expect(host.created()).toEqual([]);
  });

  it('Observable validator: succeeds via firstValueFrom', async () => {
    const subj = new Subject<string>();
    const { fixture, host, el, dir } = setup();
    host.validator.set(() => subj as unknown as Promise<string>);
    fixture.detectChanges();
    el.value = 'obs';
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(dir.state.status()).toBe('pending');
    subj.next('OBSERVED');
    subj.complete();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.created()).toEqual(['OBSERVED']);
  });

  it('supersede: a later validation drops the earlier resolution (monotonic validationId)', async () => {
    const { fixture, host, el, dir } = setup();
    let resolveFirst!: (value: string) => void;
    let resolveSecond!: (value: string) => void;
    let attempt = 0;
    host.validator.set(() => {
      attempt += 1;
      if (attempt === 1) {
        return new Promise<string>((resolve) => {
          resolveFirst = resolve;
        });
      }
      return new Promise<string>((resolve) => {
        resolveSecond = resolve;
      });
    });
    fixture.detectChanges();

    // First validation (in-flight)
    el.value = 'first';
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(dir.state.status()).toBe('pending');

    // Second validation supersedes the first
    el.value = 'second';
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    // Resolve first AFTER second is in flight — must be dropped
    resolveFirst('first-resolved');
    await Promise.resolve();
    fixture.detectChanges();
    expect(dir.state.status()).toBe('pending');
    expect(host.created()).toEqual([]);

    // Resolve second — its result wins
    resolveSecond('second-resolved');
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
    expect(dir.state.status()).toBe('success');
    expect(host.created()).toEqual(['second-resolved']);
  });
});
