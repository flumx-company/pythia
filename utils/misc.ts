import _ from 'lodash';

export const retry = async (fn: any, ...args: any[]) => {
  const runFunction = async (currentIteration = 1): Promise<any> => {
    try {
      await fn(...args);
    } catch (err) {
      if (currentIteration === 5) {
        throw err;
        return;
      }

      return runFunction(currentIteration + 1);
    }
  };

  return runFunction();
};

export const getWatsonErrorMessage = (err: any): string => {
  if (!err) {
    return 'Undefined error';
  }

  let message = `${_.get(err, 'response.data.error') || err.message}`;

  if (!message) {
    try {
      message = err.toString();
    } catch {
      message = err;
    }
  }

  return message;
};
