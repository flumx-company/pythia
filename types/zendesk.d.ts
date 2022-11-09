export interface Ticket {
  id: string;
  title: string;
  url: string;
  type: string;
  subject: string;
  description: string;
  created_at: string;
  ticket_form_id: string;
  tags: string[];
}

export interface TicketAudit {
  // TODO: definitions
  [key: string]: any;
}

export interface TicketAuditEvent {
  // TODO: definitions
  [key: string]: any;
}

export interface TicketForm {
  // TODO: definitions
  [key: string]: any;
}

export interface Macro {
  url?: string;
  id?: number;
  title?: string;
  active?: boolean;
  updated_at?: string;
  created_at?: string;
  position?: number;
  description?: null;
  actions?: Action[];
  restriction?: null;
}

export interface Shortcut {
  id: string;
  name: string;
  message: string;
  options: string;
  scope: string;
  tags: string[];
}

export interface Action {
  field?: string;
  value?: string;
}
