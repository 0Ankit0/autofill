import { selectEngine } from '../generation/engine';
import {
  createRequestId,
  type RuntimeRequest,
  type RuntimeResponse
} from '../shared/messages';
import { loadSettings } from '../shared/settings';

async function activeTabId(): Promise<number> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('No active tab');
  return tab.id;
}

async function askContent(request: RuntimeRequest): Promise<RuntimeResponse> {
  const tabId = await activeTabId();
  return chrome.tabs.sendMessage(tabId, request);
}

chrome.runtime.onMessage.addListener(
  (
    request: RuntimeRequest,
    _sender,
    sendResponse: (response: RuntimeResponse) => void
  ) => {
    (async () => {
      try {
        if (request.type === 'extract-fields' || request.type === 'fill-fields') {
          sendResponse(await askContent(request));
          return;
        }

        if (request.type === 'generate-values') {
          const settings = await loadSettings();
          const engine = selectEngine(settings);
          const generation = await engine.generate({
            fields: request.payload.fields,
            locale: settings.preferredLocale,
            seed: settings.advancedFlags.deterministicSeed
          });
          sendResponse({
            requestId: request.requestId,
            ok: true,
            payload: { generation }
          });
          return;
        }

        if (request.type === 'get-settings') {
          sendResponse({
            requestId: request.requestId,
            ok: true,
            payload: { settings: await loadSettings() }
          });
          return;
        }

        if (request.type === 'save-settings') {
          await chrome.storage.sync.set({ extensionSettings: request.payload });
          sendResponse({
            requestId: request.requestId,
            ok: true,
            payload: { settings: request.payload }
          });
          return;
        }
      } catch (error) {
        sendResponse({
          requestId: request.requestId ?? createRequestId(),
          ok: false,
          error: (error as Error).message
        });
      }
    })();

    return true;
  }
);
