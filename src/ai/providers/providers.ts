import { AIProvider } from './aiProvider';

export class GeminiProvider implements AIProvider {
  name = 'Google Gemini';

  async generateText(prompt: string, options?: { maxTokens?: number; temperature?: number }): Promise<string> {
    // Stub implementation for future SDK integration
    console.log(`[GeminiProvider] Generating text with prompt length: ${prompt.length}`);
    return "This is a stubbed Gemini response.";
  }

  async generateJson<T>(prompt: string, schema?: any): Promise<T> {
    // Stub implementation
    console.log(`[GeminiProvider] Generating JSON...`);
    return {} as T;
  }
}

export class OpenAIProvider implements AIProvider {
  name = 'OpenAI';
  async generateText(prompt: string) { return "Stubbed OpenAI response"; }
  async generateJson<T>(prompt: string) { return {} as T; }
}

export class ClaudeProvider implements AIProvider {
  name = 'Anthropic Claude';
  async generateText(prompt: string) { return "Stubbed Claude response"; }
  async generateJson<T>(prompt: string) { return {} as T; }
}

export class OllamaProvider implements AIProvider {
  name = 'Ollama Local';
  async generateText(prompt: string) { return "Stubbed Ollama response"; }
  async generateJson<T>(prompt: string) { return {} as T; }
}
