import _ from 'lodash';
import math from 'mathjs';
import { map } from 'blend-promise-utils';
import {
  ZendeskTicket,
  ZendeskTicketAudit,
  ZendeskTicketAuditEvent,
  ZendeskTicketForm,
  DiscoveryDocument,
} from '@/db/models';
import { PythiaDiscoveryDocument, TrainingEntity } from '@/types/pythia';
import { updateTrainingStatus } from '@/jobs/trainCollection/utils';
import { toPlain } from '@/helpers/database';
import { cleanText } from '@/helpers/cleaner';
import { formatNaturalLanguageQuery, translit } from '@/helpers/misc';

// TODO: get all audits and events with ticket at once.
// At this moment following request (with subquery in 'where') returns only
// one audit and event (and a random one), so further filtering returns inconsistent results.
// For this to be implemented, keep track of these issues:
// https://github.com/sequelize/sequelize/issues/5193
// https://github.com/sequelize/sequelize/issues/5235

interface GetZendeskTicketsWithMacrosOptions {
  count?: boolean;
  where?: any;
}

// TODO: add all end-user (not agent) comments from all events before macro event.
// At the moment it returns only one audit and one audit event without additional queries.
// Also, users need to be added to database to distinguish agents from end-users.
const getZendeskTicketsWithMacros = async (
  clientId: string,
  {
    count = false,
    where = {},
  }: GetZendeskTicketsWithMacrosOptions = {},
) => ZendeskTicket[count ? 'count' : 'findAll']({
  where: {
    clientId,
    ...where,
  },
  include: [{
    model: ZendeskTicketAudit,
    as: 'audits',
    required: true,
    include: [{
      model: ZendeskTicketAuditEvent,
      as: 'events',
      required: true,
      where: {
        type: 'AgentMacroReference',
      },
    }],
  }, {
    model: ZendeskTicketForm,
  }],
  attributes: [
    'id',
    'description',
    'tags',
    'clientId',
  ],
});

const getDiscoveryDocuments = async (discoveryCollectionId: string) => {
  const dbDiscoveryDocuments = await DiscoveryDocument.findAll({
    where: {
      discoveryCollectionId,
    },
  });

  return toPlain(dbDiscoveryDocuments);
};

// see https://docs.google.com/spreadsheets/d/1fctcmwCSqmq9MpE8p2lvYfTsgvzEXllsBsC1PBqj-1w/edit#gid=208646402
// for formulas
const singleFormTestingSetFormula = math.compile('(t^2 * s^2 * N) / (d^2 * N + t^2 * s^2)');
const multipleFormTestingSetFormula = math.compile('(t^2 * N * w * (1 - w)) / (d^2 * N + t^2 * w *(1 - w))');
const formulaConstants = {
  t: 2.58,
  s: 0.5,
  d: 0.05,
};

const getTestingZendeskTicketCount = async (
  totalZendeskTicketCount: number,
  clientId: string,
) => {
  const clientZendeskTicketFormCount = await ZendeskTicketForm.count({
    where: {
      clientId,
    },
  });

  let result;
  let formula: any;

  // skip formula and use simple 70/30 ratio for small sets
  if (totalZendeskTicketCount < 2000) {
    result = totalZendeskTicketCount * 0.3;
  } else {
    if (clientZendeskTicketFormCount > 1) {
      formula = multipleFormTestingSetFormula;

      const zendeskTicketForms = toPlain(await ZendeskTicketForm.findAll({
        where: {
          clientId,
        },
      }));

      const zendeskTicketFormIds = _.map(zendeskTicketForms, 'id');
      const testingCountsByForm = await map(zendeskTicketFormIds, async id => {

        const zendeskTicketCountByForm = await getZendeskTicketsWithMacros(clientId, {
          count: true,
          where: {
            zendeskTicketFormId: id,
          },
        });

        const zendeskTicketRatioByForm = math.round(zendeskTicketCountByForm / totalZendeskTicketCount, 2);

        const args = {
          ...formulaConstants,
          N: totalZendeskTicketCount,
          w: zendeskTicketRatioByForm,
        };

        return formula.eval(args);
      });

      result = _.sum(testingCountsByForm);
    } else {
      formula = singleFormTestingSetFormula;
      result = formula.eval({
        ...formulaConstants,
        N: totalZendeskTicketCount,
      });
    }
  }

  return _.round(result);
};

interface FormTrainingEntityParams {
  discoveryDocuments: PythiaDiscoveryDocument[];
  useTranslit: boolean;
  trainingId: string;
}

const formTrainingEntities = (zendeskTickets: any[], {
  discoveryDocuments,
  useTranslit,
  trainingId,
}: FormTrainingEntityParams): TrainingEntity[] =>
  _(zendeskTickets)
    .map(zendeskTicket => {
      const { ticketForm, description, id } = zendeskTicket;
      const ticketFormName = ticketForm && cleanText(ticketForm.name);
      // const ticketDescription = cleanText(description, filterEnums.clean.ticketDescriptions);
      const ticketDescription = description;
      // db request with relations in 'where' returns only one relation
      // (i.e. audit and event) at the moment as stated above
      const ticketMacroId = _.get(zendeskTicket, 'audits[0].events[0].macroId');
      // get document id uploaded to Discovery by ticket macro id
      // to utilize it as relevant example for query
      const relevantDocument = _.find(
        discoveryDocuments,
        ({ zendeskMacroId }) => ticketMacroId === zendeskMacroId,
      ) || {} as PythiaDiscoveryDocument;

      if (!relevantDocument.discoveryId) {
        // entities without relevant example should not be included in sets
        return null;
      }

      return {
        query: {
          natural_language_query: formatNaturalLanguageQuery(useTranslit ? translit(ticketDescription) : ticketDescription),
          examples: [
            {
              document_id: relevantDocument.discoveryId,
              relevance: 10,
            },
          ],
        },
        trainingResult: {
          trainingId,
          discoveryDocumentId: relevantDocument.id,
        },
        metadata: {
          relevantDocument,
          ticketMacroId,
          ticketFormName: useTranslit ? translit(ticketFormName) : ticketFormName,
          ticketId: id,
        },
      };
    })
    .compact()
    .value();

interface FormTrainingDataQueriesParams {
  clientId: string;
  discoveryCollectionId: string;
  useTranslit: boolean;
  trainingId: string;
}

interface FormTrainingDataQueriesResult {
  training: TrainingEntity[];
  testing: TrainingEntity[];
}

export default async ({
  clientId,
  discoveryCollectionId,
  useTranslit,
  trainingId,
}: FormTrainingDataQueriesParams): Promise<FormTrainingDataQueriesResult> => {
  await updateTrainingStatus(
    'Forming representative set of training and testing data queries with positive examples',
    { discoveryCollectionId },
  );
  const discoveryDocuments = await getDiscoveryDocuments(discoveryCollectionId);

  const totalZendeskTickets = toPlain(await getZendeskTicketsWithMacros(clientId));

  // form testing set from all tickets getting previously calculated amount randomly
  const testingZendeskTicketCount = await getTestingZendeskTicketCount(_.size(totalZendeskTickets), clientId);
  const testingZendeskTickets = _.sampleSize(totalZendeskTickets, testingZendeskTicketCount);
  const testingEntities = formTrainingEntities(testingZendeskTickets, {
    discoveryDocuments,
    useTranslit,
    trainingId,
  });

  const testingEntityCount = _.size(testingEntities);

  if (!testingEntityCount) {
    throw new Error('No testing entities formed');
  }

  await updateTrainingStatus(
    `${testingEntityCount} testing entities formed`,
    {
      discoveryCollectionId,
      substep: true,
      forcePublish: true,
    },
  );

  // form training set from all other tickets not included in testing set
  const testingZendeskTicketIds = _.map(testingZendeskTickets, 'id');
  const trainingZendeskTickets = _.filter(totalZendeskTickets, ({ id }) => !_.includes(testingZendeskTicketIds, id));
  const trainingEntities = formTrainingEntities(trainingZendeskTickets, {
    discoveryDocuments,
    useTranslit,
    trainingId,
  });

  const trainingEntityCount = _.size(trainingEntities);

  if (!trainingEntityCount) {
    throw new Error('No training entities formed');
  }

  await updateTrainingStatus(
    `${trainingEntityCount} training entities formed`,
    {
      discoveryCollectionId,
      substep: true,
      forcePublish: true,
    },
  );

  return {
    testing: testingEntities,
    training: trainingEntities,
  };
};
