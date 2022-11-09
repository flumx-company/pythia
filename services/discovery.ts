import _ from 'lodash';
import { mapLimit, retry } from 'blend-promise-utils';
import discovery from '@/providers/watson/discovery';
import { DiscoveryDocument } from '@/db/models';
import { DiscoveryDocument as DiscoveryDocumentInterface }  from '@/types/watson';

interface DeleteAllDocumentsProgressParams {
  current: number;
  total: number;
}

interface DiscoveryConfig {
  discoveryCollectionNativeId: string;
  discoveryEnvironmentId: string;
  discoveryApiKey: string;
  discoveryUrl: string;
  discoveryCollectionId?: string;
}

interface DeleteAllDocumentsParams extends DiscoveryConfig {
  onProgress?: (arg: DeleteAllDocumentsProgressParams) => any;
}

export const deleteAllDocuments = async ({
  discoveryCollectionId,
  discoveryCollectionNativeId,
  discoveryEnvironmentId,
  discoveryApiKey,
  discoveryUrl,
  onProgress,
}: DeleteAllDocumentsParams) => {
  const discoveryApiConfig = {
    collectionId: discoveryCollectionNativeId,
    environmentId: discoveryEnvironmentId,
    apiKey: discoveryApiKey,
    url: discoveryUrl,
  };

  const { results: discoveryDocuments } = await discovery.collections.query({
    query: '',
    count: 10000,
    ...discoveryApiConfig,
  } as any);

  const totalDocumentCount = _.size(discoveryDocuments);
  let currentDocumentCount = 0;

  if (onProgress) {
    await onProgress({
      current: currentDocumentCount,
      total: totalDocumentCount,
    });
  }

  if (!totalDocumentCount) {
    return;
  }

  await DiscoveryDocument.destroy({
    where: {
      discoveryCollectionId,
    },
  });

  return mapLimit(discoveryDocuments, 10, async ({ id }) => {
    await discovery.documents.delete(id, discoveryApiConfig as any);

    if (onProgress) {
      await onProgress({
        current: ++currentDocumentCount,
        total: totalDocumentCount,
      });
    }
  });
};

interface CheckDocumentUploadedOptions extends DiscoveryConfig {}

const checkDocumentUploaded = async (documentId: string, {
  discoveryCollectionNativeId,
  discoveryEnvironmentId,
  discoveryApiKey,
  discoveryUrl,
}: CheckDocumentUploadedOptions): Promise<string> => {
  const {
    status,
  } = await retry(discovery.documents.listDetails, {
    delayMs: 3000,
    maxAttempts: 5,
  })(documentId, {
    collectionId: discoveryCollectionNativeId,
    environmentId: discoveryEnvironmentId,
    apiKey: discoveryApiKey,
    url: discoveryUrl,
  } as any);

  if (_.includes(['available', 'available with notices', 'active'], status)) {
    return documentId;
  }

  return checkDocumentUploaded(documentId, {
    discoveryCollectionNativeId,
    discoveryEnvironmentId,
    discoveryApiKey,
    discoveryUrl,
  });
};

interface UploadDocumentsProgressParams {
  current: number;
  total: number;
}

interface UploadDocumentsOptions extends DiscoveryConfig {
  onProgress?: (arg: UploadDocumentsProgressParams) => any;
}

interface DiscoveryDocumentToUpload extends DiscoveryDocumentInterface {
  zendeskMacroDbId?: string;
  zendeskShortcutDbId?: string;
}

export const uploadDocuments = async (documents: DiscoveryDocumentToUpload[], {
  discoveryCollectionId,
  discoveryCollectionNativeId,
  discoveryEnvironmentId,
  discoveryApiKey,
  discoveryUrl,
  onProgress,
}: UploadDocumentsOptions) => {
  let currentDocumentCount = 0;
  const totalDocumentCount = _.size(documents);

  if (onProgress) {
    onProgress({
      current: currentDocumentCount,
      total: totalDocumentCount,
    });
  }

  return mapLimit(documents, 10, async document => {
    const { document_id: documentId } = await retry(discovery.documents.add, {
      maxAttempts: 5,
      delayMs: 1000,
    })(document, {
      environmentId: discoveryEnvironmentId,
      collectionId: discoveryCollectionNativeId,
      apiKey: discoveryApiKey,
      url: discoveryUrl,
    } as any);

    await checkDocumentUploaded(documentId, {
      discoveryCollectionNativeId,
      discoveryEnvironmentId,
      discoveryApiKey,
      discoveryUrl,
    });

    const {
      zendeskMacroDbId,
      zendeskShortcutDbId,
      zendeskMacroId,
      zendeskShortcutId,
      ...otherDocumentKeys
    } = document;

    const params = {
      ...otherDocumentKeys,
      discoveryCollectionId,
      discoveryId: documentId,
    };

    const dbDiscoveryDocument = await DiscoveryDocument.create(params);

    if (zendeskMacroDbId) {
      dbDiscoveryDocument.setZendeskMacro(zendeskMacroDbId);
    } else if (zendeskShortcutDbId) {
      dbDiscoveryDocument.setZendeskShortcut(zendeskShortcutDbId);
    }

    if (onProgress) {
      onProgress({
        current: ++currentDocumentCount,
        total: totalDocumentCount,
      });
    }

    return documentId;
  });

};
