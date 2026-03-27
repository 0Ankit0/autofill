import { describe, expect, it } from 'vitest';
import { migrateLegacySettings } from '../../src/shared/settings';

describe('settings migration', () => {
  it('maps legacy chrome provider', () => {
    const migrated = migrateLegacySettings('chrome');
    expect(migrated.generationMode).toBe('chrome-prompt');
    expect(migrated.enableChromePrompt).toBe(true);
  });

  it('maps legacy external key', () => {
    const migrated = migrateLegacySettings('openai', 'k');
    expect(migrated.generationMode).toBe('external');
    expect(migrated.providerKeys.openai).toBe('k');
  });

  it('maps legacy huggingface provider too', () => {
    const migrated = migrateLegacySettings('huggingface', 'hf');
    expect(migrated.generationMode).toBe('external');
    expect(migrated.providerKeys.huggingface).toBe('hf');
  });
});
