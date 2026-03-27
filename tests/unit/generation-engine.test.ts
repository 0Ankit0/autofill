import { describe, expect, it } from 'vitest';
import { selectEngine } from '../../src/generation/engine';
import { OfflineSemanticEngine } from '../../src/generation/offlineSemantic';
import { ChromePromptEngine } from '../../src/providers/chromePrompt';
import { ExternalProviderEngine } from '../../src/providers/externalProvider';

describe('engine selection', () => {
  it('defaults to offline semantic', () => {
    const engine = selectEngine({
      generationMode: 'offline-semantic',
      preferredLocale: 'en-US',
      enableChromePrompt: false,
      providerKeys: {},
      advancedFlags: {}
    });
    expect(engine).toBeInstanceOf(OfflineSemanticEngine);
  });

  it('selects chrome prompt only when enabled', () => {
    const engine = selectEngine({
      generationMode: 'chrome-prompt',
      preferredLocale: 'en-US',
      enableChromePrompt: true,
      providerKeys: {},
      advancedFlags: {}
    });
    expect(engine).toBeInstanceOf(ChromePromptEngine);
  });

  it('selects external engine for external mode', () => {
    const engine = selectEngine({
      generationMode: 'external',
      preferredLocale: 'en-US',
      enableChromePrompt: false,
      providerKeys: { openai: 'x' },
      advancedFlags: {}
    });
    expect(engine).toBeInstanceOf(ExternalProviderEngine);
  });
});
