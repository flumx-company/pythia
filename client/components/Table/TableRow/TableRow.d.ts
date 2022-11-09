export interface TableRowProps {
  document: Document;
  domain?: string;
}

export interface Document {
  id: string;
  title?: string;
  cases?: number;
  average?: number;
  median?: number;
  zendeskMacroId: string;
  applyAutomation: boolean;
  submitAutomation: boolean;
  disableSubmitButton: boolean;
  trainingResults?: any[];
}
