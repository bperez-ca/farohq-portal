/**
 * Authenticated fetch - uses credentials only, no Bearer token from client.
 * Next.js route handlers obtain the token from Clerk session cookies via getClerkToken().
 */

export async function authenticatedFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
}
