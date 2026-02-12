import { ChatComposer } from './ChatComposer';
import { ChatList } from './ChatList';
import type { ChatLayoutProps } from './chat.types';

export function ChatLayout({
  draft,
  setDraft,
  messages,
  status,
  error,
  hasOlder,
  isSending,
  isLoadingOlder,
  unreadCount,
  canSend,
  listRef,
  isAtBottom,
  loadOlder,
  scrollToBottom,
  send
}: ChatLayoutProps) {
  return (
    <div className="chat-shell">
      <ChatList
        messages={messages}
        status={status}
        error={error}
        hasOlder={hasOlder}
        isLoadingOlder={isLoadingOlder}
        unreadCount={unreadCount}
        listRef={listRef}
        isAtBottom={isAtBottom}
        onLoadOlder={() => void loadOlder()}
        onJumpToBottom={scrollToBottom}
      />
      <ChatComposer
        draft={draft}
        isSending={isSending}
        canSend={canSend}
        onDraftChange={setDraft}
        onSend={() => void send()}
      />
    </div>
  );
}
