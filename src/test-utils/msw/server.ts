import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW server instance for tests.
 * This server is configured with default handlers and can be extended
 * in individual tests using server.use()
 */
export const server = setupServer(...handlers);

/**
 * Enable request logging for debugging (disabled by default)
 * Uncomment to see all intercepted requests
 */
// server.events.on('request:start', ({ request }) => {
//   console.log('MSW intercepted:', request.method, request.url);
// });

/**
 * Log unhandled requests - helps identify missing handlers
 */
server.events.on('request:unhandled', ({ request }) => {
  console.warn('Found an unhandled %s request to %s', request.method, request.url);
});
