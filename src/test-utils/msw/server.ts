import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW server instance for tests.
 * This server is configured with default handlers and can be extended
 * in individual tests using server.use()
 */
export const server = setupServer(...handlers);

/**
 * Log unhandled requests - helps identify missing handlers
 */
server.events.on('request:unhandled', ({ request }) => {
  // eslint-disable-next-line no-console
  console.warn('Found an unhandled %s request to %s', request.method, request.url);
});
