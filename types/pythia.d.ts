export interface PythiaClient {
  id?: string;
  name: string;
  description: string;
  zendeskDomain: string;
  zendeskUsername: string;
  zendeskApiToken: string;
  zendeskChatPassword: string;
  zendeskChatApiToken: string;
  discoveryEnvironmentId?: string;
  discoveryConfigurationId?: string;
  discoveryUsername: string;
  discoveryPassword: string;
  discoveryApiKey: string;
  discoveryUrl: string;
  nluUsername: string;
  nluPassword: string;
  nluApiKey: string;
  createdAt?: string;
  updatedAt?: string;
  collections?: PythiaDiscoveryCollection[];
  zendeskTicketForms?: PythiaZendeskTicketForm[];
  zendeskTickets?: PythiaZendeskTicket[];
}

export type PythiaDiscoveryCollectionType = 'macros' | 'shortcuts';

export interface PythiaDiscoveryCollection {
  id?: string;
  name: string;
  description: string;
  discoveryId: string;
  nluModelId?: string;
  isDefault: boolean;
  type: PythiaDiscoveryCollectionType;
  isBeingTrained: boolean;
  lastTrainedAt: string;
  createdAt?: string;
  updatedAt?: string;
  documents?: PythiaDiscoveryDocument;
}

export interface PythiaDiscoveryDocument {
  id?: string;
  title: string;
  text: string;
  discoveryId: string;
  zendeskMacroId?: string;
  zendeskShortcutId?: string;
  createdAt?: string;
  updatedAt?: string;
  zendeskTickets?: PythiaZendeskTicket[];
}

export interface PythiaUser {
  id?: string;
  email: string;
  password: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PythiaZendeskTicket {
  id?: string;
  subject: string;
  type: string;
  description: string;
  tags: string[];
  url: string;
  zendeskId?: string;
  zendeskCreatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  audits: PythiaZendeskTicketAudit[];
  ticketFormId?: string;
  zendeskTicketFormId?: string;
  clientId?: string;
  ticketForm?: PythiaZendeskTicketForm;
}

export interface PythiaZendeskTicketForm {
  id?: string;
  name: string;
  position: number;
  active: boolean;
  default: boolean;
  ticketFieldIds: string;
  zendeskId?: string;
  zendeskCreatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  clientId?: string;
  zendeskTickets?: PythiaZendeskTicket[];
}

export interface PythiaZendeskTicketAudit {
  id?: string;
  zendeskId?: string;
  zendeskAuthorId?: string;
  zendeskCreatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  ticketId?: string;
  zendeskTicketId?: string;
  events?: PythiaZendeskTicketAuditEvent[];
}

export interface PythiaZendeskTicketAuditEvent {
  id?: string;
  type: string;
  body: string;
  value: string;
  previousValue: string;
  fieldName: string;
  macroId?: string;
  zendeskId?: string;
  createdAt?: string;
  updatedAt?: string;
  zendeskTicketAuditId?: string;
}

export interface PythiaTrainingResult {
  id?: string;
  rankBeforeTraining?: number;
  rankAfterTraining?: number;
  scoreBeforeTraining?: number;
  scoreAfterTraining?: number;
  trainingId?: string;
  discoveryDocumentId?: string;
  zendeskTicketId?: string;
}

export interface TrainingEntityQueryExample {
  document_id: string;
  relevance: number;
}

export interface TrainingEntityQuery {
  natural_language_query: string;
  examples: TrainingEntityQueryExample[];
}

export interface TrainingEntityMetadata {
  relevantDocument: any;
  ticketMacroId: string;
  ticketFormName?: string;
  ticketId?: string;
}

export interface TrainingEntity {
  query: TrainingEntityQuery;
  trainingResult: PythiaTrainingResult;
  metadata: TrainingEntityMetadata;
}

export interface PythiaZendeskMacro {
  id: string;
  title: string;
  description: string;
  active: boolean;
  actions: any[];
  position: number;
  restriction: any;
  zendeskId: string;
  zendeskCreatedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PythiaZendeskShortcut {
  id: string;
  name: string;
  message: string;
  scope: string;
  agents: string[];
  departments: string[];
  options: string;
  tags: string[];
  zendeskId: string;
  createdAt?: string;
  updatedAt?: string;
}
