import { describe, expect, it } from 'vitest';
import { extractFieldDescriptors } from '../../src/form/descriptors';
import { fillFields } from '../../src/form/fill';

describe('extract/fill integration', () => {
  it('extracts and fills text field', () => {
    document.body.innerHTML =
      '<label for="first">First Name</label><input id="first" name="first" />';
    const fields = extractFieldDescriptors();
    expect(fields).toHaveLength(1);
    const result = fillFields(fields, {
      [fields[0].fieldId]: {
        fieldId: fields[0].fieldId,
        value: 'Avery',
        source: 'offline-semantic'
      }
    });
    expect(result.successCount).toBe(1);
    expect((document.getElementById('first') as HTMLInputElement).value).toBe(
      'Avery'
    );
  });

  it('groups radio and checkbox sets as logical fields', () => {
    document.body.innerHTML = `
      <input type="radio" name="size" value="s" /><label>Small</label>
      <input type="radio" name="size" value="m" /><label>Medium</label>
      <input type="checkbox" name="interest" value="music" /><label>Music</label>
      <input type="checkbox" name="interest" value="sports" /><label>Sports</label>
    `;

    const fields = extractFieldDescriptors();
    expect(fields.find((f) => f.type === 'radio-group')).toBeTruthy();
    expect(fields.find((f) => f.type === 'checkbox-group')).toBeTruthy();
  });
});
