import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { createDirectiveFixture, type DirectiveFixture } from '@cngx/testing';
import { CngxHoverable } from './hoverable.directive';

@Component({
  template: '<div cngxHoverable></div>',
  imports: [CngxHoverable],
})
class Host {}

describe('CngxHoverable', () => {
  let ctx: DirectiveFixture<CngxHoverable, Host>;

  beforeEach(async () => {
    ctx = await createDirectiveFixture(CngxHoverable, Host);
  });

  it('starts with hovered=false', () => {
    expect(ctx.directive.hovered()).toBe(false);
  });

  function host(): HTMLElement {
    return ctx.fixture.debugElement.query(By.css('div')).nativeElement as HTMLElement;
  }

  const pointer = (type: string, pointerType: string) =>
    new PointerEvent(type, { pointerType, bubbles: false });

  it('sets hovered=true on a mouse pointerenter', () => {
    host().dispatchEvent(pointer('pointerenter', 'mouse'));
    expect(ctx.directive.hovered()).toBe(true);
  });

  it('sets hovered=false on pointerleave', () => {
    host().dispatchEvent(pointer('pointerenter', 'pen'));
    host().dispatchEvent(pointer('pointerleave', 'pen'));
    expect(ctx.directive.hovered()).toBe(false);
  });

  it('does not hover on touch, so a tap leaves no sticky state', () => {
    host().dispatchEvent(pointer('pointerenter', 'touch'));
    // The emulated mouse events a browser sends after a tap must not set it either.
    host().dispatchEvent(new MouseEvent('mouseenter'));
    expect(ctx.directive.hovered()).toBe(false);
  });

  it('exposes hovered as a read-only view (no .set on the public surface)', () => {
    expect('set' in ctx.directive.hovered).toBe(false);
    expect('update' in ctx.directive.hovered).toBe(false);
  });
});
