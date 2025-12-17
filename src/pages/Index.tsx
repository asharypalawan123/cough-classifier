import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AudioRecorder } from '@/utils/audioRecorder';
import WaveformVisualizer from '@/components/WaveformVisualizer';
import ResultsCard from '@/components/ResultsCard';
import { Mic, Square, Loader2, Activity, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ACCEPTED_FORMATS = '.wav,.webm,.mp3';
const ACCEPTED_MIME_TYPES = ['audio/wav', 'audio/webm', 'audio/mpeg', 'audio/mp3', 'audio/x-wav'];

interface CoughAnalysis {
  classification: string;
  confidence: number;
  characteristics: string[] | string;
  causes: string[] | string;
  recommendations: string[] | string;
  whenToSeeDoctor: string;
}

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioData, setAudioData] = useState<any>();
  const [analysis, setAnalysis] = useState<CoughAnalysis | null>(null);
  const [recorder] = useState(() => new AudioRecorder());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const analyzeAudio = async (base64Audio: string) => {
    setIsAnalyzing(true);
    setAnalysis(null);

    toast({
      title: "Analyzing cough",
      description: "AI is processing your audio...",
    });

    try {
      const { data, error } = await supabase.functions.invoke('classify-cough', {
        body: { audioData: base64Audio }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAnalysis(data.analysis);
      toast({
        title: "Analysis complete",
        description: `Detected: ${data.analysis.classification}`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Could not analyze audio",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file format",
        description: "Please upload a WAV, WebM, or MP3 file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    try {
      const base64Audio = await blobToBase64(file);
      await analyzeAudio(base64Audio);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Could not process the audio file",
        variant: "destructive",
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    try {
      await recorder.start((data) => {
        setAudioData(data);
      });
      setIsRecording(true);
      setAnalysis(null);
      toast({
        title: "Recording started",
        description: "Cough into your microphone",
      });
    } catch (error) {
      toast({
        title: "Recording failed",
        description: error instanceof Error ? error.message : "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      const audioBlob = await recorder.stop();
      const base64Audio = await recorder.blobToBase64(audioBlob);
      await analyzeAudio(base64Audio);
    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: "Recording failed",
        description: error instanceof Error ? error.message : "Could not process recording",
        variant: "destructive",
      });
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="py-8 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Activity className="w-10 h-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Cough Classifier
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-powered cough analysis to help identify cough types and provide insights
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pb-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Visualizer Card */}
          <div className="bg-card rounded-2xl p-8 shadow-card">
            <div className="space-y-6">
              <WaveformVisualizer isRecording={isRecording} audioData={audioData} />
              
              {/* Recording Controls */}
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-4">
                  {!isRecording && !isAnalyzing && (
                    <>
                      <Button
                        onClick={startRecording}
                        size="lg"
                        className="bg-gradient-primary hover:opacity-90 text-white font-semibold px-8 py-6 rounded-full shadow-recording transition-all"
                      >
                        <Mic className="w-6 h-6 mr-2" />
                        Record
                      </Button>
                      
                      <span className="text-muted-foreground text-sm">or</span>
                      
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        size="lg"
                        variant="outline"
                        className="font-semibold px-8 py-6 rounded-full transition-all"
                      >
                        <Upload className="w-6 h-6 mr-2" />
                        Upload File
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_FORMATS}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </>
                  )}
                  
                  {isRecording && (
                    <Button
                      onClick={stopRecording}
                      size="lg"
                      className="bg-gradient-accent hover:opacity-90 text-white font-semibold px-8 py-6 rounded-full shadow-recording animate-pulse-glow transition-all"
                    >
                      <Square className="w-6 h-6 mr-2" />
                      Stop & Analyze
                    </Button>
                  )}
                  
                  {isAnalyzing && (
                    <Button
                      disabled
                      size="lg"
                      className="bg-muted text-muted-foreground px-8 py-6 rounded-full"
                    >
                      <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                      Analyzing...
                    </Button>
                  )}
                </div>
              </div>

              {/* Instructions */}
              {!isRecording && !isAnalyzing && !analysis && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Record a cough or upload an audio file (WAV, WebM, MP3)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Max file size: 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          {analysis && (
            <div className="animate-in slide-in-from-bottom duration-700">
              <ResultsCard analysis={analysis} />
            </div>
          )}

          {/* Info Footer */}
          <div className="bg-card/50 rounded-xl p-6 text-center border border-border/50">
            <p className="text-sm text-muted-foreground">
              This tool uses AI to analyze cough sounds and provide preliminary insights.
              <br />
              <strong className="text-foreground">Always consult a healthcare professional for medical advice.</strong>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
