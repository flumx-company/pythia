import _ from 'lodash';
import { PubSub } from 'graphql-subscriptions';
import { Client } from '@/db/models';
import messages from '@/enums/messages';
import { toPlain } from '@/helpers/database';
import Entity from '@/types/entity';

interface FilterEntitiesByQueryOptions {
  highlightClassName?: string;
}

export const getClientById = async (clientId: string): Promise<any> => {
  const dbClient = await Client.findOne({
    where: {
      id: clientId,
    },
  });

  if (!dbClient) {
    throw new Error(messages.CLIENT_NOT_FOUND);
  }

  return toPlain(dbClient);
};

/**
 * Adds Zendesk metadata (e.g. tags for shortcuts) for appropridate Discovery documents.
 */
export const addZendeskMetadataToDocuments = (documents: any[], entities: any[], type?: string) => {
  return _.map(
    documents,
    document => {
      let entityObject;

      if (type === 'shortcuts') {
        const shortcut = _.find(entities, ({ name }) => name === document.zendeskShortcutId);

        entityObject = {
          zendeskShortcutId: document.zendeskShortcutId,
        };

        if (shortcut) {
          entityObject = {
            ...entityObject,
            title: shortcut.name,
            text: shortcut.message,
            zendeskShortcutTags: shortcut.tags,
          };
        }
      } else if (type === 'macros') {
        entityObject = {
          zendeskMacroId: document.zendeskMacroId,
        };
      }

      return {
        id: document.id,
        title: document.title,
        text: document.text,
        ...entityObject,
      };
    },
  );
};

export const filterEntitiesByQuery = (entities: Entity[], query: string, {
  highlightClassName = 'pythia-highlight',
}: FilterEntitiesByQueryOptions = {}): Entity[] => {
  const words = _.words(query);

  if (!words.length) {
    return [];
  }

  const regex = new RegExp(words.join('|'), 'gi');

  // XXX: use reduce for better performance
  return _(entities)
    // order first by title matches, then by text matches (text matches have lower score here)
    .orderBy(
      entity =>
        (_.size(entity.title.match(regex)) * 20) ||
        (entity.text && _.size(entity.text.match(regex))),
        'desc',
      )
    .map(entity => {
      const hasTitleMatch = !!entity.title.match(regex);
      const hasTextMatch = entity.text && !!entity.text.match(regex);

      const highlightedFields = [];

      if (hasTitleMatch) {
        highlightedFields.push('title');
      }

      if (hasTextMatch) {
        highlightedFields.push('text');
      }

      const addHighlightTags = (str: string) => str.replace(regex, `<span class="${highlightClassName}">$&</span>`);

      return {
        ...entity,
        highlightedFields,
        highlightedTitle: addHighlightTags(entity.title),
        highlightedText: entity.text && addHighlightTags(entity.text),
      };
    })
    .filter(({ highlightedFields }) => !!_.size(highlightedFields))
    .value();
};

export const pubsub = new PubSub();
