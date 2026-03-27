import { extractFieldDescriptors } from '../form/descriptors';
import { fillFields } from '../form/fill';
import type { RuntimeRequest, RuntimeResponse } from '../shared/messages';

let cached = extractFieldDescriptors();
const observer = new MutationObserver(() => {
  cached = extractFieldDescriptors();
});
observer.observe(document.documentElement, {
  subtree: true,
  childList: true,
  attributes: true
});

chrome.runtime.onMessage.addListener(
  (
    request: RuntimeRequest,
    _sender,
    sendResponse: (response: RuntimeResponse) => void
  ) => {
    if (request.type === 'extract-fields') {
      cached = extractFieldDescriptors();
      sendResponse({ requestId: request.requestId, ok: true, payload: { fields: cached } });
      return true;
    }

    if (request.type === 'fill-fields') {
      const fill = fillFields(request.payload.fields, request.payload.values);
      sendResponse({ requestId: request.requestId, ok: true, payload: { fill } });
      return true;
    }

    return true;
  }
);
