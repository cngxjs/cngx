// Slot normalisation shared by get_slots and the migrate diff. A fetched release
// snapshot is only checked for its top-level lists, so a slot list may carry a
// null slot, a missing or blank name, or not be a list at all; such slots are
// dropped here instead of throwing on them.

import type { DocSlot } from './types.js';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

/**
 * One slot, or `null` when it has no usable name. compodocx records a multi-line
 * `@slot` body as the slot `name` with an empty `description`; such a name is
 * split: the first token is the name, the rest (minus its `<example-url>`
 * elements) the description, unless a description was recorded. A no-op on a
 * well-formed slot, so it stays harmless once compodocx is fixed.
 */
export function normalizeSlot(slot: unknown): DocSlot | null {
  if (!isRecord(slot) || typeof slot.name !== 'string' || slot.name.trim() === '') {
    return null;
  }
  const raw = slot.name;
  const description = typeof slot.description === 'string' ? slot.description : '';
  const [name, ...rest] = raw.trim().split(/\s+/);
  if (rest.length === 0) {
    return { name: raw, description };
  }
  const trailing = raw
    .trim()
    .slice(name.length)
    .replace(/<example-url>[\s\S]*?<\/example-url>/g, '')
    .trim();
  return { name, description: description.trim() === '' ? trailing : description };
}

/** The usable slots of an entry; a `slots` value that is not a list counts as empty. */
export function normalizeSlots(slots: unknown): DocSlot[] {
  if (!Array.isArray(slots)) {
    return [];
  }
  return slots.map(normalizeSlot).filter((slot): slot is DocSlot => slot !== null);
}
