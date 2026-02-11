import type { Message, RawMessage } from './types';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit'
});

// Normalize potential string values from API payloads.
const safeString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

// Extract author names from common API response shapes.
const coerceAuthor = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return safeString(value);
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return (
      safeString(record.name) ||
      safeString(record.fullName) ||
      safeString(record.displayName)
    );
  }
  return null;
};

// Extract message text from common API response shapes.
const coerceMessage = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return safeString(value);
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return null;
};

// Convert various date payloads into ISO strings.
const coerceDate = (value: unknown): string => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }
  return new Date().toISOString();
};

// Provide a stable message id when the API doesn't include one.
const buildMessageId = (raw: RawMessage): string => {
  const numericId = typeof raw.id === 'number' ? String(raw.id) : null;
  const id = safeString(raw.id) || safeString(raw._id) || numericId;
  if (id) {
    return id;
  }
  const author =
    coerceAuthor(raw.author) || coerceAuthor(raw.user) || coerceAuthor(raw.sender) || 'Unknown';
  const message =
    coerceMessage(raw.message) ||
    coerceMessage(raw.text) ||
    coerceMessage(raw.body) ||
    coerceMessage(raw.content) ||
    '...';
  const createdAt =
    safeString(raw.createdAt) ||
    safeString(raw.created_at) ||
    safeString(raw.timestamp) ||
    safeString(raw.time) ||
    safeString(raw.date) ||
    new Date().toISOString();
  return `${author}-${createdAt}-${message}`;
};

// Normalize unknown API payloads into the app's Message shape.
export const normalizeMessage = (raw: RawMessage): Message => {
  const id = buildMessageId(raw);
  const author =
    coerceAuthor(raw.author) || coerceAuthor(raw.user) || coerceAuthor(raw.sender) || 'Unknown';
  const message =
    coerceMessage(raw.message) ||
    coerceMessage(raw.text) ||
    coerceMessage(raw.body) ||
    coerceMessage(raw.content) ||
    '(empty message)';
  const createdAt = coerceDate(
    safeString(raw.createdAt) ||
      safeString(raw.created_at) ||
      safeString(raw.timestamp) ||
      safeString(raw.time) ||
      safeString(raw.date) ||
      raw.createdAt ||
      raw.timestamp
  );

  return {
    id,
    author,
    message,
    createdAt
  };
};

export const sortMessages = (messages: Message[]): Message[] =>
  [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

export const mergeMessages = (existing: Message[], incoming: Message[]): Message[] => {
  const map = new Map<string, Message>();
  [...existing, ...incoming].forEach((message) => {
    map.set(message.id, message);
  });
  return sortMessages(Array.from(map.values()));
};

export const formatTime = (iso: string): string =>
  timeFormatter.format(new Date(iso));

export const formatDayLabel = (iso: string): string =>
  dateFormatter.format(new Date(iso));
