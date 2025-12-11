// API configuration for connecting to the Python backend
// Set VITE_API_URL in your environment variables when deploying

import { convertToWav } from './audioUtils';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cough-classifier-production.up.railway.app';

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
  // First check if backend is available
  const isHealthy = await checkApiHealth();
  if (!isHealthy) {
    throw new Error('Backend server is not available. Please ensure the Railway backend is deployed and running.');
  }

  // Convert to WAV format for better compatibility with librosa
  console.log('Converting audio to WAV format...');
  const { blob: processedBlob, converted } = await convertToWav(audioBlob);
  console.log(`Audio ${converted ? 'converted to WAV' : 'kept in original format'}, size:`, processedBlob.size);

  const base64Audio = await blobToBase64(processedBlob);

  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('Sending request to:', `${API_BASE_URL}/predict`);

  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ audio: base64Audio }),
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response text:', responseText.substring(0, 200));

    if (!response.ok) {
      throw new Error(`API Error (${response.status}): ${responseText.substring(0, 100)}`);
    }

    try {
      return JSON.parse(responseText);
    } catch {
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to the backend. Check CORS settings and server availability.');
    }
    throw error;
  }
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
