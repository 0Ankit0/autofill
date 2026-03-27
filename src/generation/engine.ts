import type { ExtensionSettings, GenerationEngine } from '../shared/types';
import { OfflineSemanticEngine } from './offlineSemantic';
import { ChromePromptEngine } from '../providers/chromePrompt';
import { ExternalProviderEngine } from '../providers/externalProvider';

export function selectEngine(settings: ExtensionSettings): GenerationEngine {
  if (settings.generationMode === 'chrome-prompt' && settings.enableChromePrompt) {
    return new ChromePromptEngine(settings);
  }

  if (settings.generationMode === 'external') {
    return new ExternalProviderEngine(settings);
  }

  return new OfflineSemanticEngine();
}
