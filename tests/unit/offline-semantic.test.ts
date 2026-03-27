import { describe, expect, it } from 'vitest';
import { OfflineSemanticEngine } from '../../src/generation/offlineSemantic';
import type { FieldDescriptor } from '../../src/shared/types';

function field(partial: Partial<FieldDescriptor>): FieldDescriptor {
  return {
    fieldId: 'x',
    type: 'text',
    tagName: 'input',
    label: 'Name',
    visible: true,
    locators: {},
    locatorCandidates: [],
    validation: {},
    options: [],
    ...partial
  };
}

describe('offline semantic coherence', () => {
  it('keeps first/last/email coherent with deterministic seed', async () => {
    const engine = new OfflineSemanticEngine();
    const fields = [
      field({ fieldId: 'first', label: 'First Name' }),
      field({ fieldId: 'last', label: 'Last Name' }),
      field({ fieldId: 'email', label: 'Email', type: 'email' })
    ];

    const result = await engine.generate({ fields, locale: 'en-US', seed: 42 });

    const first = String(result.values.first.value).toLowerCase();
    const last = String(result.values.last.value).toLowerCase();
    const email = String(result.values.email.value);

    expect(email).toContain(`${first}.${last}`);
  });
});
