export interface AIProvider {
  /**
   * The name of the AI provider.
   */
  name: string;

  /**
   * Generates a text response from a given prompt.
   */
  generateText(prompt: string, options?: { maxTokens?: number; temperature?: number }): Promise<string>;
  
  /**
   * Generates a structured JSON response from a given prompt.
   */
  generateJson<T>(prompt: string, schema?: any): Promise<T>;
}

export type ProviderType = 'gemini' | 'openai' | 'claude' | 'ollama' | 'mock';
