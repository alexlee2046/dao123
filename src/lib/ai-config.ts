export const AI_CONFIG = {
  images: {
    models: [
      {
        id: 'openai/dall-e-3',
        name: 'DALL-E 3',
        cost: 10,
      },
      {
        id: 'openai/gpt-image-1',
        name: 'GPT Image',
        cost: 10,
      },
      {
        id: 'stabilityai/stable-diffusion-xl-beta-v2-2-2',
        name: 'Stable Diffusion XL',
        cost: 10,
      },
      {
        id: 'black-forest-labs/flux-1.1-pro',
        name: 'Flux 1.1 Pro',
        cost: 15,
      },
      {
        id: 'google/gemini-3-pro-image-preview',
        name: 'Gemini 3 Pro',
        cost: 15,
      },
    ],
    defaultModel: 'openai/dall-e-3',
  },
};

export function getImageModelConfig(modelId?: string) {
  const model = AI_CONFIG.images.models.find((m) => m.id === modelId);
  if (model) return model;
  
  // Fallback to default
  return AI_CONFIG.images.models.find((m) => m.id === AI_CONFIG.images.defaultModel)!;
}
