const DiscoveryDocument = require('../../../db/models').DiscoveryDocument;
import logger from '@/helpers/logger';

export default async (root: any, args: any) => {
    const { id, ...value } = args;
    try {
        if (!id || value === null) {
            throw new Error('Please fill all required fields.');
        }
        const document = await DiscoveryDocument.findByPk(id);
        if (!document) {
            throw new Error('Document not Found');
        }
        return await document.update(value);
    } catch (err) {
        logger.error(err);
        return err;
    }
};
