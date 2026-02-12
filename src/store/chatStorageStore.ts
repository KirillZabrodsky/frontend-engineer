import type { Message } from '../types';
import type { PersistedChatState } from './chatStorage.types';

const STORAGE_KEY = 'frontend-engineer.chat-state.v1';
const MAX_STORED_MESSAGES = 200;

const EMPTY_STATE: PersistedChatState = {
  draft: '',
  messages: []
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

const isValidMessage = (value: unknown): value is Message => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.author === 'string' &&
    typeof value.message === 'string' &&
    typeof value.createdAt === 'string'
  );
};

const sanitizeMessages = (value: unknown): Message[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isValidMessage)
    .slice(-MAX_STORED_MESSAGES)
    .map((message) => ({
      id: message.id,
      author: message.author,
      message: message.message,
      createdAt: message.createdAt,
      pending: Boolean(message.pending),
      failed: Boolean(message.failed)
    }));
};

const hasStorage = (): boolean => typeof window !== 'undefined' && Boolean(window.localStorage);

const load = (): PersistedChatState => {
  if (!hasStorage()) {
    return EMPTY_STATE;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return EMPTY_STATE;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) {
      return EMPTY_STATE;
    }

    const draft = typeof parsed.draft === 'string' ? parsed.draft : '';
    return {
      draft,
      messages: sanitizeMessages(parsed.messages)
    };
  } catch {
    return EMPTY_STATE;
  }
};

const save = (state: PersistedChatState): void => {
  if (!hasStorage()) {
    return;
  }

  try {
    const payload: PersistedChatState = {
      draft: state.draft,
      messages: state.messages.slice(-MAX_STORED_MESSAGES)
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage write failures.
  }
};

export const chatStorageStore = {
  load,
  save
};
