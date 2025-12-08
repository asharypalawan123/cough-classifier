import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Droplets, Wind, ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';

interface ResultState {
  prediction: 'dry' | 'wet';
  confidence: number;
}

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultState | null;

  // Redirect to home if no result data
  if (!state) {
    return <Navigate to="/" replace />;
  }

  const { prediction, confidence } = state;
  const isDry = prediction === 'dry';

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
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {/* Result Card */}
          <div className={cn(
            "overflow-hidden rounded-3xl border-2 shadow-card",
            isDry ? "border-amber-500/30" : "border-sky-500/30"
          )}>
            {/* Icon Section */}
            <div className={cn(
              "flex flex-col items-center gap-4 py-12",
              isDry 
                ? "bg-gradient-to-b from-amber-500/10 to-transparent" 
                : "bg-gradient-to-b from-sky-500/10 to-transparent"
            )}>
              <div className={cn(
                "flex h-24 w-24 items-center justify-center rounded-full",
                isDry ? "bg-amber-500/20" : "bg-sky-500/20"
              )}>
                {isDry ? (
                  <Wind className="h-12 w-12 text-amber-600" />
                ) : (
                  <Droplets className="h-12 w-12 text-sky-600" />
                )}
              </div>
              <div className="text-center">
                <h1 className={cn(
                  "text-4xl font-bold tracking-tight",
                  isDry ? "text-amber-600" : "text-sky-600"
                )}>
                  {isDry ? 'Dry Cough' : 'Wet Cough'}
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">
                  Classification Result
                </p>
              </div>
            </div>

            {/* Details Section */}
            <div className="bg-card p-6">
              <div className="rounded-xl bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Confidence Score
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    {confidence.toFixed(1)}%
                  </span>
                </div>
                {/* Confidence Bar */}
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      isDry ? "bg-amber-500" : "bg-sky-500"
                    )}
                    style={{ width: `${confidence}%` }}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="mt-6 rounded-xl border border-border p-4">
                <h3 className="font-semibold text-foreground">What this means</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {isDry 
                    ? "A dry cough produces little to no mucus. It's often caused by throat irritation, allergies, or viral infections."
                    : "A wet cough produces mucus or phlegm. It's often associated with respiratory infections, bronchitis, or pneumonia."
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button
            variant="gradient"
            size="lg"
            className="w-full"
            onClick={() => navigate('/')}
          >
            <RotateCcw className="h-5 w-5" />
            Analyze Another Cough
          </Button>

          {/* Disclaimer */}
          <p className="text-center text-xs text-muted-foreground">
            This is not a medical diagnosis. Please consult a healthcare professional for medical advice.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Result;
