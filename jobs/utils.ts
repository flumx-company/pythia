import _ from 'lodash';
import cache from '@/utils/cache';
import { pubsub } from '@/server/api/utils';
import logger from '@/helpers/logger';

interface JobStatusSubstep {
  label: string;
  key?: string;
}

interface JobStatusStep {
  label: string;
  output?: string;
  type?: string;
  substeps: JobStatusSubstep[];
}

interface JobStatus {
  steps?: JobStatusStep[];
  error?: string | null;
  id?: string;
  [key: string]: any;
}

interface GetJobCacheKeyParams {
  id: string;
  type: string;
}

const getJobCacheKey = ({ id, type }: GetJobCacheKeyParams) => `job:${type}:${id}`;

interface JobStatusParams {
  id: string;
  type: string;
}

export const getJobStatus = async ({
  id,
  type,
}: JobStatusParams): Promise<JobStatus> => {
  return await cache.get(getJobCacheKey({ id, type })) || {};
};

const publish = _.debounce(pubsub.publish.bind(pubsub), 500);

interface SetJobStatusOptions {
  forcePublish?: boolean;
}

export const setJobStatus = async (
  status: JobStatus,
  {
    id,
    type,
  }: JobStatusParams,
  {
    forcePublish,
  }: SetJobStatusOptions = {},
) => {
  const currentJobStatus = (await cache.get(getJobCacheKey({ id, type }))) || {};
  const newJobStatus = {
    ...currentJobStatus,
    ...status,
    id,
  };

  const topic = type;

  if (forcePublish) {
    pubsub.publish(topic, {
      [topic]: newJobStatus,
    });
  } else {
    publish(topic, {
      [topic]: newJobStatus,
    });
  }

  return cache.set(getJobCacheKey({ id, type }), newJobStatus);
};

export const setInitialJobStatus = async ({
  id,
  type,
}: JobStatusParams,
  additionalParams: Object = {},
): Promise<null> =>
  setJobStatus({
    id,
    steps: [],
    ...additionalParams,
  }, { id, type });

export const clearJobStatus = ({
  id,
  type,
}: JobStatusParams) => cache.delete(getJobCacheKey({ id, type }));

interface AddJobStatusStepOptions {
  type?: string;
  labelType?: string;
  forcePublish?: boolean;
}

export const addJobStatusStep = async (
  label: string,
  {
    id,
    type,
  }: JobStatusParams,
  {
    labelType,
    forcePublish,
  }: AddJobStatusStepOptions = {},
  ): Promise<JobStatusStep> => {
  const currentJobStatus = await getJobStatus({ id, type });

  const statusStep = {
    label,
    type: labelType,
    substeps: [],
  };

  return setJobStatus({
    steps: [
      ...(currentJobStatus.steps || []),
      statusStep,
    ],
  }, {
    id,
    type,
  }, {
    forcePublish,
  });
};

interface AddJobStatusSubstepOptions {
  update?: boolean;
  key?: string;
  type?: string;
  forcePublish?: boolean;
}

const addJobStatusSubstep = async (
  label: string,
  {
    id,
    type,
  }: JobStatusParams,
  {
    update,
    key,
    forcePublish,
  }: AddJobStatusSubstepOptions = {},
  ): Promise<JobStatusStep | void> => {
  const currentJobStatus = await getJobStatus({ id, type });
  const { steps } = currentJobStatus;

  if (!steps) {
    return;
  }

  const statusSubstep = {
    label,
    key,
  };

  const stepCount = _.size(steps);

  const newSteps = _.map(steps, (step, i) => {
    if (i + 1 !== stepCount) {
      return step;
    }

    let substeps: JobStatusSubstep[] = [];

    if (_.size(step.substeps)) {
      if (key) {
        const hasSubstepWithKey = _.find(step.substeps, substep => substep.key === key);

        substeps = hasSubstepWithKey
          ? _.map(step.substeps, substep => {
            if (substep.key === key) {
              return statusSubstep;
            }

            return substep;
          })
          : [
            ...step.substeps,
            statusSubstep,
          ];
      } else if (update) {
        substeps = [
          ..._.initial(step.substeps),
          statusSubstep,
        ];
      }
    } else {
      substeps = [
        statusSubstep,
      ];
    }

    return {
      ...step,
      substeps,
    };
  });

  return setJobStatus({
    steps: [
      ...newSteps,
    ],
  }, {
    id,
    type,
  }, {
    forcePublish,
  });
};

export const addJobErrorStatus = async (
  err: Error | string,
  {
    id,
    type,
  }: JobStatusParams,
) => {
  const errorMessage = typeof err === 'string' ? err : err.message;

  const currentJobStatus = await getJobStatus({ id, type });

  await setJobStatus({
    error: errorMessage,
    steps: [
      ...(currentJobStatus.steps || []),
      {
        label: errorMessage,
        type: 'error',
        substeps: [],
      },
    ],
  }, { id, type });
};

interface UpdateJobStatusParams {
  labelType?: string;
  onlyLog?: boolean;
  substep?: boolean;
  update?: boolean;
  forcePublish?: boolean;
  key?: string;
}

export const updateJobStatus = async (
  label: string,
  {
    id,
    type,
  }: JobStatusParams,
  {
    labelType,
    onlyLog = false,
    substep = false,
    update = false,
    forcePublish = false,
    key,
  }: UpdateJobStatusParams = {},
) => {
  if (!onlyLog) {
    if (substep) {
      await addJobStatusSubstep(label, { id, type }, { update, key, forcePublish });
    } else {
      await addJobStatusStep(label, { id, type }, { labelType, forcePublish });
    }
  }

  const logLevel = labelType === 'error' ? 'error' : 'debug';

  // do not log substeps for now to avoid growing log file in size
  if (!substep || logLevel === 'error') {
    logStep(label, { id, type, logLevel });
  }
};

interface LogStepOptions {
  id: string;
  type?: string;
  logLevel?: string;
}

export const logStep = (label: string, { id, type, logLevel = 'debug' }: LogStepOptions) => {
  logger[logLevel](`${type ? `${type} ` : ''}${id}: ${label}`);
};
