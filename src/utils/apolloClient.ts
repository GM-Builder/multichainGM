// src/utils/apolloClient.ts

import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { SUBGRAPH_ENDPOINTS, ChainName } from './subgraph';

// Create Apollo Client for specific chain
export const createSubgraphClient = (chain: ChainName) => {
  return new ApolloClient({
    link: new HttpLink({
      uri: SUBGRAPH_ENDPOINTS[chain],
      fetch,
    }),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            globalStats: {
              merge: true,
            },
            navigator: {
              merge: true,
            },
          },
        },
      },
    }),
    defaultOptions: {
      query: {
        fetchPolicy: 'cache-first',
        errorPolicy: 'all',
      },
    },
  });
};

// Create clients for all chains
export const subgraphClients = {
  base: createSubgraphClient('base'),
  ink: createSubgraphClient('ink'),
  soneium: createSubgraphClient('soneium'),
};