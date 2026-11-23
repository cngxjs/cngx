import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { registerByName } from './register-by-name';

@Component({ template: '' })
class Host {
  readonly name = signal<string | undefined>('one');
  readonly log: string[] = [];

  constructor() {
    registerByName(
      this.name,
      (name) => this.log.push(`+${name}`),
      (name) => this.log.push(`-${name}`),
    );
  }
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return { fixture, host: fixture.componentInstance };
}

describe('registerByName', () => {
  it('registers the name with the first change detection', () => {
    const { host } = setup();
    expect(host.log).toEqual(['+one']);
  });

  it('unregisters the old name before registering a new one', () => {
    const { fixture, host } = setup();
    host.name.set('two');
    fixture.detectChanges();
    expect(host.log).toEqual(['+one', '-one', '+two']);
  });

  it('unregisters on an empty name without registering', () => {
    const { fixture, host } = setup();
    host.name.set(undefined);
    fixture.detectChanges();
    host.name.set('');
    fixture.detectChanges();
    expect(host.log).toEqual(['+one', '-one']);
  });

  it('unregisters on destroy', () => {
    const { fixture, host } = setup();
    fixture.destroy();
    expect(host.log).toEqual(['+one', '-one']);
  });
});
