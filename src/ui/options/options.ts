import { createRequestId, type RuntimeRequest, type RuntimeResponse } from '../../shared/messages';
import type { ExtensionSettings } from '../../shared/types';

const modeEl = document.getElementById('mode') as HTMLSelectElement;
const localeEl = document.getElementById('locale') as HTMLInputElement;
const chromePromptEl = document.getElementById('chromePrompt') as HTMLInputElement;
const openaiEl = document.getElementById('openai') as HTMLInputElement;
const geminiEl = document.getElementById('gemini') as HTMLInputElement;
const huggingfaceEl = document.getElementById('huggingface') as HTMLInputElement;
const seedEl = document.getElementById('seed') as HTMLInputElement;
const statusEl = document.getElementById('status') as HTMLElement;

async function send(request: RuntimeRequest): Promise<RuntimeResponse> {
  return chrome.runtime.sendMessage(request);
}

async function load() {
  const response = await send({ requestId: createRequestId(), type: 'get-settings' });
  if (!response.ok) return;
  const s = response.payload.settings;
  modeEl.value = s.generationMode;
  localeEl.value = s.preferredLocale;
  chromePromptEl.checked = s.enableChromePrompt;
  openaiEl.value = s.providerKeys.openai ?? '';
  geminiEl.value = s.providerKeys.gemini ?? '';
  huggingfaceEl.value = s.providerKeys.huggingface ?? '';
  seedEl.value = String(s.advancedFlags.deterministicSeed ?? '');
}

document.getElementById('save')!.addEventListener('click', async () => {
  const settings: ExtensionSettings = {
    generationMode: modeEl.value as ExtensionSettings['generationMode'],
    preferredLocale: localeEl.value || 'en-US',
    enableChromePrompt: chromePromptEl.checked,
    providerKeys: {
      openai: openaiEl.value || undefined,
      gemini: geminiEl.value || undefined,
      huggingface: huggingfaceEl.value || undefined
    },
    advancedFlags: {
      deterministicSeed: Number(seedEl.value) || undefined
    }
  };
  const response = await send({ requestId: createRequestId(), type: 'save-settings', payload: settings });
  statusEl.textContent = response.ok ? 'Saved.' : response.error;
});

void load();
