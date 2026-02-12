import { MessageItem } from './MessageItem';
import type { ChatListProps } from './chat.types';

export function ChatList({
  messages,
  status,
  error,
  hasOlder,
  isLoadingOlder,
  unreadCount,
  listRef,
  isAtBottom,
  onLoadOlder,
  onJumpToBottom
}: ChatListProps) {
  return (
    <div className="chat-list" ref={listRef} role="log" aria-live="polite" aria-relevant="additions">
      <div className="chat-list__top">
        {hasOlder && (
          <button
            className="chat-button"
            type="button"
            onClick={onLoadOlder}
            disabled={isLoadingOlder}
          >
            {isLoadingOlder ? 'Loading earlier...' : 'Load earlier messages'}
          </button>
        )}
        {!hasOlder && messages.length > 0 && (
          <p className="chat-list__hint">You are at the beginning of the conversation.</p>
        )}
      </div>

      {error && status === 'error' && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      {status === 'loading' && (
        <div className="empty-state">
          <p>Loading the conversation...</p>
        </div>
      )}

      {status !== 'loading' && messages.length === 0 && (
        <div className="empty-state">
          <p>No messages yet. Say hello to get things started.</p>
        </div>
      )}

      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}

      {unreadCount > 0 && !isAtBottom.current && (
        <div className="chat-jump">
          <button
            className="chat-jump__button"
            type="button"
            onClick={onJumpToBottom}
            aria-label={`Jump to ${unreadCount} new messages`}
          >
            {unreadCount} new
          </button>
        </div>
      )}
    </div>
  );
}
