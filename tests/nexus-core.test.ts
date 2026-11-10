import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateUUID, isValidUUID, ensureUUID } from '../src/utils/uuid.ts';

describe('UUID Utilities (RFC 4122 v4)', () => {
  test('generateUUID generates a valid UUID v4', () => {
    const uuid = generateUUID();
    assert.ok(typeof uuid === 'string');
    assert.strictEqual(uuid.length, 36);
    assert.ok(isValidUUID(uuid), `Generated UUID "${uuid}" should be valid`);
  });

  test('isValidUUID correctly validates format', () => {
    const valid = '123e4567-e89b-42d3-a456-426614174000';
    const validUpper = '123E4567-E89B-42D3-A456-426614174000';
    const invalidShort = '123e4567-e89b-42d3-a456';
    const invalidChars = '123e4567-e89b-42d3-a456-42661417400z';
    const empty = '';

    assert.strictEqual(isValidUUID(valid), true);
    assert.strictEqual(isValidUUID(validUpper), true);
    assert.strictEqual(isValidUUID(invalidShort), false);
    assert.strictEqual(isValidUUID(invalidChars), false);
    assert.strictEqual(isValidUUID(empty), false);
    assert.strictEqual(isValidUUID(null), false);
    assert.strictEqual(isValidUUID(undefined), false);
    assert.strictEqual(isValidUUID(12345), false);
  });

  test('ensureUUID preserves valid UUID and replaces invalid ones', () => {
    const valid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    assert.strictEqual(ensureUUID(valid), valid);

    const validWithSpaces = '  a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11  ';
    assert.strictEqual(ensureUUID(validWithSpaces), valid);

    const invalid = 'not-a-valid-uuid';
    const regenerated = ensureUUID(invalid);
    assert.notStrictEqual(regenerated, invalid);
    assert.ok(isValidUUID(regenerated));
  });

  test('generateUUID creates unique identifiers', () => {
    const set = new Set<string>();
    for (let i = 0; i < 50; i++) {
      set.add(generateUUID());
    }
    assert.strictEqual(set.size, 50);
  });
});
