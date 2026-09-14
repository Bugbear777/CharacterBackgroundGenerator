type BuilderProgressProps = {
    currentStep: number;
    totalSteps: number;
    stepName: string;
  };
  
  export function BuilderProgress({
    currentStep,
    totalSteps,
    stepName,
  }: BuilderProgressProps) {
    const progress = (currentStep / totalSteps) * 100;
  
    return (
      <div className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </p>
  
            <h2 className="font-heading text-xl font-semibold">
              {stepName}
            </h2>
          </div>
  
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}% complete
          </span>
        </div>
  
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }