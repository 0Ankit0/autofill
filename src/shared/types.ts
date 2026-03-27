export type GenerationMode = 'offline-semantic' | 'chrome-prompt' | 'external';

export interface FieldLocator {
  css?: string;
  xpath?: string;
  name?: string;
  id?: string;
}

export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  step?: number;
}

export interface FieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FieldDescriptor {
  fieldId: string;
  type:
    | 'text'
    | 'email'
    | 'tel'
    | 'number'
    | 'date'
    | 'textarea'
    | 'select-one'
    | 'select-multiple'
    | 'radio-group'
    | 'checkbox'
    | 'checkbox-group'
    | string;
  tagName: string;
  logicalGroup?: string;
  semanticKind?: string;
  label: string;
  placeholder?: string;
  autocomplete?: string;
  inputMode?: string;
  visible: boolean;
  locators: FieldLocator;
  locatorCandidates: FieldLocator[];
  validation: FieldValidation;
  options: FieldOption[];
}

export interface GeneratedFieldValue {
  fieldId: string;
  value: string | string[] | boolean;
  source: 'offline-semantic' | 'chrome-prompt' | 'external';
  warning?: string;
}

export interface GenerationRequest {
  fields: FieldDescriptor[];
  locale: string;
  seed?: number;
}

export interface GenerationResult {
  values: Record<string, GeneratedFieldValue>;
  warnings: string[];
}

export interface FillFieldResult {
  fieldId: string;
  success: boolean;
  reason?: string;
  recoveryHint?: string;
}

export interface FillResult {
  successCount: number;
  failureCount: number;
  fields: FillFieldResult[];
}

export interface ExtensionSettings {
  generationMode: GenerationMode;
  preferredLocale: string;
  enableChromePrompt: boolean;
  providerKeys: Partial<Record<'openai' | 'gemini' | 'huggingface', string>>;
  advancedFlags: {
    deterministicSeed?: number;
    includeHiddenFields?: boolean;
  };
}

export interface GenerationEngine {
  generate(request: GenerationRequest): Promise<GenerationResult>;
}
