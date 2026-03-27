import { OfflineSemanticEngine } from '../generation/offlineSemantic';
import type {
  ExtensionSettings,
  GenerationEngine,
  GenerationRequest,
  GenerationResult
} from '../shared/types';

export class ExternalProviderEngine implements GenerationEngine {
  private fallback = new OfflineSemanticEngine();

  constructor(private readonly settings: ExtensionSettings) {}

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const result = await this.fallback.generate(request);
    const keys = this.settings.providerKeys;

    const hasAny = Boolean(keys.openai || keys.gemini || keys.huggingface);
    if (!hasAny) {
      result.warnings.push(
        'No external provider key configured; fell back to offline-semantic generation.'
      );
      return result;
    }

    result.warnings.push(
      'External provider keys detected; offline values used by default for privacy and determinism.'
    );
    return result;
  }
}
