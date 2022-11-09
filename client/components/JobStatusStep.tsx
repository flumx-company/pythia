import React from 'react';
import classNames from 'classnames';

interface TrainingStatusSubstep {
  label: string;
}

interface TrainingStatusStep {
  label: string;
  output?: string;
  type?: string;
  substeps?: TrainingStatusSubstep[];
}

interface TrainingStatusStepProps {
  step: TrainingStatusStep;
  success?: boolean;
  error?: boolean;
}

const TrainingStatusStep = ({ step: { label, substeps }, success, error }: TrainingStatusStepProps) => (
  <div
    className={classNames({
      'mt-1': true,
      'text-grey-darker': !success && !error,
      'text-green': success,
      'text-red': error,
    })}
  >
    {label}

    {substeps && substeps.map(({ label: substepLabel }, i) => (
      <div className="ml-2 mt-1 text-grey-dark text-sm" key={i}>{substepLabel}</div>
    ))}
  </div>
);

export default TrainingStatusStep;
