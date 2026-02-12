import type { MutableRefObject, RefObject } from 'react';
import type { Message } from '../types';

export type ChatStatus = 'idle' | 'loading' | 'ready' | 'error';

export type UseChatResult = {
  draft: string;
  setDraft: (value: string) => void;
  messages: Message[];
  status: ChatStatus;
  error: string | null;
  hasOlder: boolean;
  isSending: boolean;
  isLoadingOlder: boolean;
  unreadCount: number;
  canSend: boolean;
  listRef: RefObject<HTMLDivElement>;
  isAtBottom: MutableRefObject<boolean>;
  loadOlder: () => Promise<void>;
  scrollToBottom: () => void;
  send: () => Promise<void>;
};
