export type AIService = 'openrouter' | 'openai' | 'openai:pro' | 'openai:flash';

export interface AIResult {
  success: boolean;
  data?: string;
  provider?: string;
  model?: string;
  error?: string;
}

export interface AITaskOptions {
  openrouterTimeout?: number;
  openaiTimeout?: number;
  openrouterModel?: string;
  openaiModel?: string;
  maxTokens?: number;
  temperature?: number;
  services?: AIService[];
}
