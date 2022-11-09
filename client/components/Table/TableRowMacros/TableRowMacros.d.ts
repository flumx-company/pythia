export interface TableRowMacrosProps {
  usages: Usages;
  domain?: string;
}

export interface Usages {
  id: string;
  title?: string;
  cases?: number;
  average?: number;
  median?: number;
  zendeskMacroId: string;
  zendeskShortcutId: string;
  applyAutomation: boolean;
  submitAutomation: boolean;
  disableSubmitButton: boolean;
}
