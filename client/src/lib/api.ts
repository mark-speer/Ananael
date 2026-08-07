/**
 * Authenticated API fetch — always sends cookies (HttpOnly JWT).
 * Do not attach Authorization headers; the session cookie is the credential.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  return fetch(input, {
    ...init,
    credentials: 'include',
    headers,
  });
}
