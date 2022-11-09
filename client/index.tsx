import React from 'react';
import { render } from 'react-dom';
import { Router } from 'react-router-dom';
import { ApolloClient } from 'apollo-client';
import { ApolloLink, split } from 'apollo-link';
import { createHttpLink } from 'apollo-link-http';
import { WebSocketLink } from 'apollo-link-ws';
import { onError, ErrorResponse } from 'apollo-link-error';
import { setContext } from 'apollo-link-context';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloProvider } from 'react-apollo';
import { getMainDefinition } from 'apollo-utilities';
import { GraphQLError } from 'graphql';
import App from '@/App';
import { showError } from '@/services/notifications';
import history from '@/utils/history';
import { isProduction } from '@/utils/misc';

// require('@/styles/index.pcss');
import '@/styles/index.pcss';

interface Definintion {
  kind: string;
  operation?: string;
}

const defaultOptions = {
  watchQuery: {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  },
  query: {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  },
  mutate: {
    errorPolicy: 'all',
  },
};

const errorLink = onError(({ networkError, graphQLErrors }: ErrorResponse) => {
  if (graphQLErrors) {
    graphQLErrors.map((err: GraphQLError) => {
      console.error(err);
      showError(err.message);
    });
  }

  // XXX: remove when networkError.statusCode TS property is implemented
  const networkErrorCloned: any = { ...networkError };

  if (networkErrorCloned && networkErrorCloned.statusCode) {
    if (networkErrorCloned.statusCode === 401) {
      showError('Please log in first.');
      history.push('/login');
    }
  }
});

const httpLink = createHttpLink({
  uri: '/api',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const wsUri = isProduction
  ? 'wss://app.pythia.cc/api'
  : 'ws://localhost:5000/api';

const wsLink = new WebSocketLink({
  // XXX: find way to pass server config to the client
  // XXX: check if websockets if secure enough
  //      (currently you can connect to them from external server,
  //       e.g. wscat -c ws://app.pythia.cc/api)
  uri: wsUri,
  options: {
    reconnect: true,
  },
});

const httpOrWsLink = split(
  ({ query }) => {
    const { kind, operation }: Definintion = getMainDefinition(query);
    return kind === 'OperationDefinition' && operation === 'subscription';
  },
  wsLink,
  httpLink,
);

const link = ApolloLink.from([
  errorLink,
  authLink,
  httpOrWsLink,
]);

const client = new ApolloClient({
  // @ts-ignore
  defaultOptions,
  link,
  cache: new InMemoryCache(),
});

// tslint:disable jsx-wrap-multiline
// see https://github.com/palantir/tslint-react/issues/79
render(
  <ApolloProvider client={client}>
    <Router history={history}>
      <App />
    </Router>
  </ApolloProvider>,
  document.querySelector('main') as HTMLElement,
);
// tslint:enable jsx-wrap-multiline
