import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { resolveSpokenText } from './spoken-text';

function html(markup: string): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = markup;
  return el;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="cell">
    <span aria-hidden="true">!</span>
    <strong>Error:</strong>
    <span>Denied</span>
  </div>`,
})
class SpokenTextHost {}

describe('resolveSpokenText', () => {
  it('skips an aria-hidden glyph next to the message', () => {
    expect(resolveSpokenText(html('<span aria-hidden="true">!</span> Permission denied'))).toBe(
      'Permission denied',
    );
  });

  it('skips hidden subtrees', () => {
    expect(resolveSpokenText(html('Saved <span hidden>internal</span>'))).toBe('Saved');
  });

  it('joins nested text in document order', () => {
    expect(resolveSpokenText(html('<b>Err:</b> <em>timeout</em> - <span>retry?</span>'))).toBe(
      'Err: timeout - retry?',
    );
  });

  it('breaks words at element boundaries without whitespace between the tags', () => {
    expect(resolveSpokenText(html('<strong>Error:</strong><span>Denied</span>'))).toBe(
      'Error: Denied',
    );
    expect(resolveSpokenText(html('<p>Saved</p><p>Draft kept</p>'))).toBe('Saved Draft kept');
  });

  it('breaks words at element boundaries in a compiled Angular template', () => {
    const fixture = TestBed.createComponent(SpokenTextHost);
    fixture.detectChanges();
    const cell = (fixture.nativeElement as HTMLElement).querySelector('.cell')!;
    expect(resolveSpokenText(cell)).toBe('Error: Denied');
  });

  it('collapses whitespace and trims', () => {
    expect(resolveSpokenText(html('\n   Saving\n\n   draft   '))).toBe('Saving draft');
  });

  it('reads the element itself even when it is aria-hidden', () => {
    const el = html('Failed');
    el.setAttribute('aria-hidden', 'true');
    expect(resolveSpokenText(el)).toBe('Failed');
  });

  it('ignores comment nodes and returns an empty string for no text', () => {
    expect(resolveSpokenText(html('<!-- container -->'))).toBe('');
  });
});
