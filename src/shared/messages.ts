import type {
  ExtensionSettings,
  FieldDescriptor,
  FillResult,
  GenerationResult
} from './types';

export type RuntimeRequest =
  | { requestId: string; type: 'extract-fields' }
  | {
      requestId: string;
      type: 'generate-values';
      payload: { fields: FieldDescriptor[] };
    }
  | {
      requestId: string;
      type: 'fill-fields';
      payload: {
        fields: FieldDescriptor[];
        values: GenerationResult['values'];
      };
    }
  | { requestId: string; type: 'get-settings' }
  | {
      requestId: string;
      type: 'save-settings';
      payload: ExtensionSettings;
    };

export type RuntimeResponse =
  | { requestId: string; ok: true; payload: { fields: FieldDescriptor[] } }
  | { requestId: string; ok: true; payload: { generation: GenerationResult } }
  | { requestId: string; ok: true; payload: { fill: FillResult } }
  | { requestId: string; ok: true; payload: { settings: ExtensionSettings } }
  | { requestId: string; ok: false; error: string };

export const createRequestId = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;
