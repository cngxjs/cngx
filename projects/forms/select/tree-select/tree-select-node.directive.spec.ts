import { Component, contentChild, TemplateRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxTreeSelectNode } from './tree-select-node.directive';

@Component({
  selector: 'cngx-host-consumer',
  imports: [CngxTreeSelectNode],
  template: `<ng-content />`,
})
class HostConsumer {
  readonly slot = contentChild(CngxTreeSelectNode);
}

@Component({
  imports: [CngxTreeSelectNode, HostConsumer],
  template: `
    <cngx-host-consumer>
      <ng-template cngxTreeSelectNode let-node>{{ node.id }}</ng-template>
    </cngx-host-consumer>
  `,
})
class TestProjector {}

describe('CngxTreeSelectNode', () => {
  it('exposes a TemplateRef that a contentChild query can reach', () => {
    const fixture = TestBed.createComponent(TestProjector);
    fixture.detectChanges();
    const hostDe = fixture.debugElement.children[0];
    const host = hostDe.componentInstance as HostConsumer;
    const slot = host.slot();
    expect(slot).toBeInstanceOf(CngxTreeSelectNode);
    expect(slot?.templateRef).toBeInstanceOf(TemplateRef);
  });
});
