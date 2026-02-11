import type { RawMessage } from './types';

export const DEFAULT_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';
export const DEFAULT_TOKEN =
  import.meta.env.VITE_API_TOKEN ?? 'super-secret-doodle-token';

type MessageQuery = {
  after?: string;
  before?: string;
  limit?: number;
};

const normalizeBaseUrl = (baseUrl: string): string => baseUrl.replace(/\/$/, '');

const buildMessagesUrl = (baseUrl: string, query?: MessageQuery): URL => {
  const url = new URL(`${normalizeBaseUrl(baseUrl)}/messages`);
  if (query?.after) {
    url.searchParams.set('after', query.after);
  }
  if (query?.before) {
    url.searchParams.set('before', query.before);
  }
  if (typeof query?.limit === 'number') {
    url.searchParams.set('limit', String(query.limit));
  }
  return url;
};

const authHeaders = (token: string): HeadersInit => ({
  Authorization: `Bearer ${token}`
});

// Consistent error formatting for non-2xx responses.
const ensureOk = (response: Response, message: string): void => {
  if (response.ok) {
    return;
  }
  throw new Error(`${message} (${response.status})`);
};

// JSON parsing with a null fallback for non-JSON responses.
const safeJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

// Support common API response shapes: array, { data: [...] }, { messages: [...] }.
const extractMessages = (body: unknown): RawMessage[] => {
  if (Array.isArray(body)) {
    return body as RawMessage[];
  }
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    if (Array.isArray(record.data)) {
      return record.data as RawMessage[];
    }
    if (Array.isArray(record.messages)) {
      return record.messages as RawMessage[];
    }
  }
  return [];
};

export type FetchMessagesParams = {
  baseUrl: string;
  token: string;
  after?: string;
  before?: string;
  limit?: number;
  signal?: AbortSignal;
};

export async function fetchMessages({
  baseUrl,
  token,
  after,
  before,
  limit,
  signal
}: FetchMessagesParams): Promise<RawMessage[]> {
  const url = buildMessagesUrl(baseUrl, { after, before, limit });
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: authHeaders(token),
    signal
  });

  ensureOk(response, 'Failed to load messages');
  const body = await response.json();
  return extractMessages(body);
}

export type SendMessageParams = {
  baseUrl: string;
  token: string;
  message: string;
  author: string;
  signal?: AbortSignal;
};

export async function sendMessage({
  baseUrl,
  token,
  message,
  author,
  signal
}: SendMessageParams): Promise<RawMessage | null> {
  const url = buildMessagesUrl(baseUrl);
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      author
    }),
    signal
  });

  ensureOk(response, 'Failed to send message');
  const body = await safeJson(response);
  if (body && typeof body === 'object') {
    return body as RawMessage;
  }
  return null;
}
