import type { ExtensionSettings } from './types';

export const DEFAULT_SETTINGS: ExtensionSettings = {
  generationMode: 'offline-semantic',
  preferredLocale: 'en-US',
  enableChromePrompt: false,
  providerKeys: {},
  advancedFlags: {}
};

export async function loadSettings(): Promise<ExtensionSettings> {
  const data = await chrome.storage.sync.get([
    'extensionSettings',
    'provider',
    'apiKey'
  ]);
  if (data.extensionSettings) {
    return { ...DEFAULT_SETTINGS, ...data.extensionSettings };
  }
  const migrated = migrateLegacySettings(data.provider, data.apiKey);
  await chrome.storage.sync.set({ extensionSettings: migrated });
  return migrated;
}

export function migrateLegacySettings(
  provider?: string,
  apiKey?: string
): ExtensionSettings {
  const next = { ...DEFAULT_SETTINGS };
  if (!provider) return next;

  if (provider === 'chrome') {
    next.generationMode = 'chrome-prompt';
    next.enableChromePrompt = true;
    return next;
  }

  if (provider === 'huggingface') {
    next.generationMode = 'external';
    if (apiKey) next.providerKeys.huggingface = apiKey;
    return next;
  }

  if (provider === 'openai' || provider === 'gemini') {
    next.generationMode = 'external';
    if (apiKey) next.providerKeys[provider] = apiKey;
  }

  return next;
}
