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

  it('sets hovered=true on mouseenter', () => {
    const el = ctx.fixture.debugElement.query(By.css('div'));
    el.triggerEventHandler('mouseenter');
    expect(ctx.directive.hovered()).toBe(true);
  });

  it('sets hovered=false on mouseleave', () => {
    const el = ctx.fixture.debugElement.query(By.css('div'));
    el.triggerEventHandler('mouseenter');
    el.triggerEventHandler('mouseleave');
    expect(ctx.directive.hovered()).toBe(false);
  });

  it('exposes hovered as a read-only view (no .set on the public surface)', () => {
    expect('set' in ctx.directive.hovered).toBe(false);
    expect('update' in ctx.directive.hovered).toBe(false);
  });
});
