import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AudioUploader } from '@/components/AudioUploader';
import { AudioRecorder } from '@/components/AudioRecorder';
import { Logo } from '@/components/Logo';
import { classifyCough } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

type InputMode = 'upload' | 'record';

const Index = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<InputMode>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const hasAudio = selectedFile !== null || recordedBlob !== null;

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setRecordedBlob(null);
  }, []);

  const handleRecordingComplete = useCallback((blob: Blob) => {
    setRecordedBlob(blob);
    setSelectedFile(null);
  }, []);

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const handleClearRecording = useCallback(() => {
    setRecordedBlob(null);
  }, []);

  const handleAnalyze = async () => {
    const audioBlob = selectedFile || recordedBlob;
    if (!audioBlob) return;

    setIsAnalyzing(true);
    try {
      const result = await classifyCough(audioBlob);
      navigate('/result', { 
        state: { 
          prediction: result.predicted_cough_type,
          confidence: result.confidence_score 
        } 
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Could not analyze the audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-center px-4">
          <Logo size="sm" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-lg px-4 py-12">
        <div className="animate-slide-up space-y-8">
          {/* Title Section */}
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Cough Classifier
            </h1>
            <p className="mt-3 text-muted-foreground">
              Upload or record a cough sound to determine if it's dry or wet
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex justify-center">
            <div className="inline-flex rounded-lg border border-border bg-muted/50 p-1">
              <button
                onClick={() => setMode('upload')}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  mode === 'upload'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Upload File
              </button>
              <button
                onClick={() => setMode('record')}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  mode === 'record'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Record Audio
              </button>
            </div>
          </div>

          {/* Audio Input */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            {mode === 'upload' ? (
              <AudioUploader
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                onClear={handleClearFile}
              />
            ) : (
              <AudioRecorder
                onRecordingComplete={handleRecordingComplete}
                onClear={handleClearRecording}
                hasRecording={recordedBlob !== null}
              />
            )}
          </div>

          {/* Analyze Button */}
          <Button
            variant="gradient"
            size="xl"
            className="w-full"
            disabled={!hasAudio || isAnalyzing}
            onClick={handleAnalyze}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Analyze Cough
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>

          {/* Info */}
          <p className="text-center text-xs text-muted-foreground">
            Your audio is processed securely and not stored after analysis
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
