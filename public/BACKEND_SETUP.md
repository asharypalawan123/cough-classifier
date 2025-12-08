# KafSens Backend Setup Guide

This guide explains how to deploy your Python/FastAPI backend on Railway.

## Backend Files Structure

Create a new folder called `kafsens-backend` with these files:

```
kafsens-backend/
├── main.py           # FastAPI application
├── requirements.txt  # Python dependencies
├── model/            # Your ML model files
│   ├── cough_classifier_model.pkl
│   ├── feature_scaler.pkl
│   └── model_config.json
└── Procfile          # Railway deployment config
```

## Step 1: Create main.py

```python
#!/usr/bin/env python3
"""
FastAPI ML Inference Service for Cough Classification
"""

import os
import warnings
warnings.filterwarnings('ignore')

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import librosa
import numpy as np
import joblib
import json
import base64
import tempfile
from typing import Optional

app = FastAPI(
    title="KafSens Cough Classification API",
    description="ML-powered API for classifying cough sounds as dry or wet",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
scaler = None
config = None

class PredictionRequest(BaseModel):
    audio: str  # Base64-encoded audio data

class PredictionResponse(BaseModel):
    predicted_cough_type: str
    confidence_score: float
    message: Optional[str] = None

def load_models():
    global model, scaler, config
    model_dir = os.path.join(os.path.dirname(__file__), "model")
    
    try:
        model = joblib.load(os.path.join(model_dir, "cough_classifier_model.pkl"))
        scaler = joblib.load(os.path.join(model_dir, "feature_scaler.pkl"))
        with open(os.path.join(model_dir, "model_config.json"), 'r') as f:
            config = json.load(f)
        print("✓ Models loaded successfully")
        return True
    except Exception as e:
        print(f"✗ Error loading models: {e}")
        return False

def extract_audio_features(audio_path, target_duration=5.0, sr=22050):
    try:
        audio, sample_rate = librosa.load(audio_path, sr=sr, duration=target_duration, res_type='kaiser_fast')
        target_length = int(target_duration * sr)
        if len(audio) < target_length:
            audio = np.pad(audio, (0, target_length - len(audio)), mode='constant')
        else:
            audio = audio[:target_length]
        
        features = []
        
        # MFCC (52 features)
        mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=13)
        features.extend(np.mean(mfcc, axis=1))
        features.extend(np.std(mfcc, axis=1))
        features.extend(np.min(mfcc, axis=1))
        features.extend(np.max(mfcc, axis=1))
        
        # Spectral features (32 features)
        for feat_func in [
            librosa.feature.spectral_centroid,
            librosa.feature.spectral_bandwidth,
            librosa.feature.spectral_rolloff,
            librosa.feature.zero_crossing_rate if hasattr(librosa.feature, 'zero_crossing_rate') else None,
        ]:
            if feat_func:
                if feat_func == librosa.feature.zero_crossing_rate:
                    feat = librosa.feature.zero_crossing_rate(audio)
                else:
                    feat = feat_func(y=audio, sr=sr)
                features.extend([np.mean(feat), np.std(feat), np.min(feat), np.max(feat)])
        
        # Zero crossing rate
        zcr = librosa.feature.zero_crossing_rate(audio)
        features.extend([np.mean(zcr), np.std(zcr), np.min(zcr), np.max(zcr)])
        
        # Chroma
        chroma = librosa.feature.chroma_stft(y=audio, sr=sr)
        features.extend([np.mean(chroma), np.std(chroma), np.min(chroma), np.max(chroma)])
        
        # Spectral contrast
        spectral_contrast = librosa.feature.spectral_contrast(y=audio, sr=sr)
        features.extend([np.mean(spectral_contrast), np.std(spectral_contrast), 
                        np.min(spectral_contrast), np.max(spectral_contrast)])
        
        # RMS Energy
        rms = librosa.feature.rms(y=audio)
        features.extend([np.mean(rms), np.std(rms), np.min(rms), np.max(rms)])
        
        # Tonnetz
        tonnetz = librosa.feature.tonnetz(y=librosa.effects.harmonic(audio), sr=sr)
        features.extend([np.mean(tonnetz), np.std(tonnetz), np.min(tonnetz), np.max(tonnetz)])
        
        return np.array(features[:85])  # Ensure 85 features
    except Exception as e:
        print(f"Feature extraction error: {e}")
        return None

@app.on_event("startup")
async def startup_event():
    load_models()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": model is not None}

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    if model is None or scaler is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        audio_bytes = base64.b64decode(request.audio)
        
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name
        
        features = extract_audio_features(tmp_path)
        os.unlink(tmp_path)
        
        if features is None:
            raise HTTPException(status_code=400, detail="Could not extract features from audio")
        
        features_scaled = scaler.transform(features.reshape(1, -1))
        prediction = model.predict(features_scaled)[0]
        probabilities = model.predict_proba(features_scaled)[0]
        confidence = float(probabilities[prediction] * 100)
        
        label = "dry" if prediction == 0 else "wet"
        
        return PredictionResponse(
            predicted_cough_type=label,
            confidence_score=confidence,
            message="Analysis complete"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## Step 2: Create requirements.txt

```
fastapi==0.104.1
uvicorn==0.24.0
python-multipart==0.0.6
librosa==0.10.1
numpy==1.26.2
scikit-learn==1.3.2
joblib==1.3.2
pydantic==2.5.2
```

## Step 3: Create Procfile

```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

## Step 4: Add Your Model Files

Copy these files to the `model/` folder:
- `cough_classifier_model.pkl`
- `feature_scaler.pkl`
- `model_config.json`

## Step 5: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Connect your GitHub repository OR use Railway CLI
4. Railway will auto-detect Python and deploy

## Step 6: Connect Frontend

After Railway deployment, copy your backend URL (e.g., `https://kafsens-backend.railway.app`)

For this Lovable frontend:
1. Go to Project Settings
2. Add environment variable: `VITE_API_URL=https://your-railway-url.railway.app`

## Local Testing

```bash
cd kafsens-backend
pip install -r requirements.txt
python main.py
```

API will be available at `http://localhost:8000`
Test with: `http://localhost:8000/health`
