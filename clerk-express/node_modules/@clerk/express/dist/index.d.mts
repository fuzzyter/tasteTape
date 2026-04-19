import { ClerkClient } from '@clerk/backend';
export * from '@clerk/backend';
import { ClerkMiddlewareOptions, AuthenticateRequestParams } from './types.mjs';
export { ExpressRequestWithAuth } from './types.mjs';
import { RequestHandler, Request } from 'express';
import { GetAuthFn, RequestState } from '@clerk/backend/internal';
import '@clerk/shared/types';
import '@clerk/shared/proxy';

declare const clerkClient: ClerkClient;

/**
 * Middleware that integrates Clerk authentication into your Express application.
 * It checks the request's cookies and headers for a session JWT and, if found,
 * attaches the Auth object to the request object under the `auth` key.
 *
 * @example
 * app.use(clerkMiddleware(options));
 *
 * @example
 * const clerkClient = createClerkClient({ ... });
 * app.use(clerkMiddleware({ clerkClient }));
 *
 * @example
 * app.use(clerkMiddleware());
 */
declare const clerkMiddleware: (options?: ClerkMiddlewareOptions) => RequestHandler;

/**
 * Retrieves the Clerk AuthObject using the current request object.
 *
 * @param {GetAuthOptions} options - Optional configuration for retriving auth object.
 * @returns {AuthObject} Object with information about the request state and claims.
 * @throws {Error} `clerkMiddleware` or `requireAuth` is required to be set in the middleware chain before this util is used.
 */
declare const getAuth: GetAuthFn<Request>;

/**
 * Middleware to require authentication for user requests.
 * Redirects unauthenticated requests to the sign-in url.
 *
 * @deprecated Use `clerkMiddleware()` with `getAuth()` instead.
 * `requireAuth` will be removed in the next major version.
 *
 * @example
 * // Before (deprecated)
 * import { requireAuth } from '@clerk/express'
 * router.get('/path', requireAuth(), getHandler)
 *
 * @example
 * // After (recommended)
 * import { clerkMiddleware, getAuth } from '@clerk/express'
 *
 * app.use(clerkMiddleware())
 *
 * app.get('/api/protected', (req, res) => {
 *   const { userId } = getAuth(req);
 *   if (!userId) {
 *     return res.status(401).json({ error: 'Unauthorized' });
 *   }
 *   // handle authenticated request
 * })
 */
declare const requireAuth: (options?: ClerkMiddlewareOptions) => RequestHandler;

/**
 * @internal
 * Authenticates an Express request by wrapping clerkClient.authenticateRequest and
 * converts the express request object into a standard web request object
 *
 * @param opts - Configuration options for request authentication
 * @param opts.clerkClient - The Clerk client instance to use for authentication
 * @param opts.request - The Express request object to authenticate
 * @param opts.options - Optional middleware configuration options
 */
declare const authenticateRequest: (opts: AuthenticateRequestParams) => Promise<RequestState<"session_token">>;

export { authenticateRequest, clerkClient, clerkMiddleware, getAuth, requireAuth };
