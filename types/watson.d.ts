export interface DiscoveryDocument {
  id?: string;
  title: string;
  text: string | null;
  zendeskMacroId?: string;
  zendeskShortcutId?: string;
  zendeskShortcutTags?: string[];
}
