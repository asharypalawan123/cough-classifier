// API configuration for connecting to the Python backend
// Set VITE_API_URL in your environment variables when deploying

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface PredictionResponse {
  predicted_cough_type: 'dry' | 'wet';
  confidence_score: number;
  message?: string;
}

export interface ApiError {
  detail: string;
}

/**
 * Convert audio blob to base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Send audio file to backend for classification
 */
export async function classifyCough(audioBlob: Blob): Promise<PredictionResponse> {
  const base64Audio = await blobToBase64(audioBlob);

  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ audio: base64Audio }),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.detail || 'Failed to classify cough');
  }

  return response.json();
}

/**
 * Check if the backend API is available
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
