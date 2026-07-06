import { ClipType, AIAnalysis } from "../types";

export const analyzeContent = async (content: string, type: ClipType): Promise<AIAnalysis> => {
  try {
    const response = await fetch('/api/gemini/analyze-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, type }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return result as AIAnalysis;
  } catch (error) {
    console.error("Client Content Analysis Error:", error);
    throw error;
  }
};

export const analyzeImage = async (imageSrc: string): Promise<AIAnalysis> => {
  try {
    const response = await fetch('/api/gemini/analyze-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageSrc }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return result as AIAnalysis;
  } catch (error) {
    console.error("Client Image Analysis Error:", error);
    throw error;
  }
};
