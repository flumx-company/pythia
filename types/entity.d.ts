export default interface Entity {
  id: string;
  title: string;
  text: string | null;
  zendeskMacroId?: string
  zendeskShortcutId?: string;
  zendeskShortcutTags?: string[];
  highlightedTitle?: string;
  highlightedText?: string | null;
  highlightedFields?: string[];
}
