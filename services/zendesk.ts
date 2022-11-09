import _ from 'lodash';
import zendesk from '@/providers/zendesk';
import shortcutsApi from '@/providers/zendesk/api/shortcuts';
import { Macro, Shortcut } from '@/types/zendesk';
import { PythiaZendeskMacro } from '@/types/pythia';
import { getCommentFromActions } from '@/services/macros';
import { translit } from '@/helpers/misc';
import { toPlain } from '@/helpers/database';
import { ZendeskDynamicContentItem } from '@/db/models';

interface OnProgressParams {
  total: number;
}

interface GetAllMacrosParams {
  zendeskUsername: string;
  zendeskApiToken: string;
  zendeskDomain: string;
  onProgress?: (arg: OnProgressParams) => any;
}

export const getAllMacros = async ({
  zendeskUsername,
  zendeskApiToken,
  zendeskDomain,
  onProgress,
}: GetAllMacrosParams): Promise<Macro[]> => {
  let totalMacros: any[] = [];

  const listMacros = async (page = 1) => {
    const { macros, nextPage } = await zendesk.macros.list({
      page,
      active: true,
    }, {
      username: zendeskUsername,
      token: zendeskApiToken,
      url: zendeskDomain,
    });

    totalMacros = _.concat(totalMacros, macros);

    if (onProgress) {
      await onProgress({
        total: _.size(totalMacros),
      });
    }

    if (nextPage) {
      await listMacros(page + 1);
    }
  };

  await listMacros();

  return totalMacros;
};

interface GetAllShortcutsParams {
  zendeskChatApiToken: string;
}

export const getAllShortcuts = async ({
  zendeskChatApiToken,
}: GetAllShortcutsParams): Promise<Shortcut[]> => {
  return shortcutsApi.list({
    token: zendeskChatApiToken,
  });
};

interface GetAllDynamicContentParams {
  zendeskUsername: string;
  zendeskApiToken: string;
  zendeskDomain: string;
  onProgress?: (arg: OnProgressParams) => any;
}

export const getAllDynamicContentItems = async ({
  zendeskUsername,
  zendeskApiToken,
  zendeskDomain,
  onProgress,
}: GetAllDynamicContentParams): Promise<any[]> => {
  let totalItems: any[] = [];

  const listDynamicContentItems = async (page = 1) => {
    const { items, nextPage } = await zendesk.dc.list({
      page,
      active: true,
    }, {
      username: zendeskUsername,
      token: zendeskApiToken,
      url: zendeskDomain,
    });

    totalItems = _.concat(totalItems, items);

    if (onProgress) {
      await onProgress({
        total: _.size(totalItems),
      });
    }

    if (nextPage) {
      await listDynamicContentItems(page + 1);
    }
  };

  await listDynamicContentItems();

  return totalItems;
};

interface PrepareMacrosParams {
  clientId: string;
  locale?: string;
  useTranslit?: boolean;
}

interface ReplaceDynamicContentOptions {
  localeId?: number;
}

export const replaceDynamicContent = (str: string, dcItems: any[], { localeId }: ReplaceDynamicContentOptions = {}) => {
  const localizedDcItems = _.reduce(dcItems, (result, { placeholder, defaultLocaleId, variants }) => {
    const localeVariant = _.find(variants, ({ locale_id }) => locale_id === (localeId || defaultLocaleId));
    result[placeholder] = localeVariant.content;
    return result;
  }, {});

  const localizedDcKeys = _(localizedDcItems).keys().join('|');

  if (!localizedDcKeys || !str) {
    return str;
  }

  return str.replace(new RegExp(localizedDcKeys, 'g'), (m: string) => localizedDcItems[m]);
};

export const prepareMacros = async (macros: PythiaZendeskMacro[], {
  clientId,
  locale,
  useTranslit = false,
}: PrepareMacrosParams) => {
  const dcItems = toPlain(await ZendeskDynamicContentItem.findAll({
    where: {
      clientId,
    },
  }));

  // TODO: implement locale fetching
  const localeId = undefined;

  return _(macros)
    .compact()
    .map(macro => {
      const { id, zendeskId } = macro;

      const title = replaceDynamicContent(macro.title, dcItems, { localeId });
      const text = replaceDynamicContent(getCommentFromActions(macro, { filter: false }), dcItems, { localeId });

      return {
        id,
        zendeskId,
        title: useTranslit ? translit(title) : title,
        text: useTranslit ? translit(text) : text,
      };
    })
    .filter('text')
    .value();
};
