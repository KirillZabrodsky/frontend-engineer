import type { Message } from '../types';

export type PersistedChatState = {
  draft: string;
  messages: Message[];
};
