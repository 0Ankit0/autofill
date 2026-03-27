import { OfflineSemanticEngine } from '../generation/offlineSemantic';
import type {
  ExtensionSettings,
  GenerationEngine,
  GenerationRequest,
  GenerationResult
} from '../shared/types';

export class ChromePromptEngine implements GenerationEngine {
  private fallback = new OfflineSemanticEngine();

  constructor(private readonly settings: ExtensionSettings) {}

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const result = await this.fallback.generate(request);

    const maybePrompt = (globalThis as Record<string, unknown>).ai as
      | { prompt?: (input: string) => Promise<string> }
      | undefined;

    if (!this.settings.enableChromePrompt || !maybePrompt?.prompt) {
      result.warnings.push(
        'Chrome Prompt API unavailable; fell back to offline-semantic generation.'
      );
      return result;
    }

    result.warnings.push(
      'Chrome Prompt API detected; offline values kept unless explicit provider prompt mapping is configured.'
    );
    return result;
  }
}
