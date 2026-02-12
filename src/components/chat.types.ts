import type { MutableRefObject, RefObject } from 'react';
import type { UseChatResult, ChatStatus } from '../hooks/useChat.types';
import type { Message } from '../types';

export type ChatComposerProps = {
  draft: string;
  isSending: boolean;
  canSend: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => void;
};

export type MessageItemProps = {
  message: Message;
};

export type ChatListProps = {
  messages: Message[];
  status: ChatStatus;
  error: string | null;
  hasOlder: boolean;
  isLoadingOlder: boolean;
  unreadCount: number;
  listRef: RefObject<HTMLDivElement>;
  isAtBottom: MutableRefObject<boolean>;
  onLoadOlder: () => void;
  onJumpToBottom: () => void;
};

export type ChatLayoutProps = UseChatResult;
