import Noty from 'noty';

if (Noty.overrideDefaults) {
  Noty.overrideDefaults({
    layout: 'bottomRight',
    theme: 'mint',
    closeWith: ['click', 'button'],
    timeout: 3000,
  });
}

interface NotificationParams {}

export const showSuccess = (text: string, params?: NotificationParams) => {
  return new Noty({
    text,
    type: 'success',
  }).show();
};

export const showWarning = (text: string, params?: NotificationParams) => {
  return new Noty({
    text,
    type: 'warning',
  }).show();
};

export const showError = (text: string, params?: NotificationParams) => {
  return new Noty({
    text,
    type: 'error',
  }).show();
};
