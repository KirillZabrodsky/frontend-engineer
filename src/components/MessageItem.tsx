import { CURRENT_AUTHOR } from '../constants';
import type { Message } from '../types';
import { formatDayLabel, formatTime } from '../utils';

type MessageItemProps = {
  message: Message;
};

export function MessageItem({ message }: MessageItemProps) {
  const isMe = message.author === CURRENT_AUTHOR;

  return (
    <article
      className={`message ${isMe ? 'message--me' : ''} ${
        message.pending ? 'message--pending' : ''
      } ${message.failed ? 'message--failed' : ''}`}
    >
      <div className="message__card">
        {/* Hide the author for the current user to mimic common chat UI */}
        {!isMe && <p className="message__author">{message.author}</p>}
        <p className="message__text">{message.message}</p>
        <div className="message__meta">
          <span className="message__time">
            {formatDayLabel(message.createdAt)} {formatTime(message.createdAt)}
          </span>
          {message.pending && <span className="message__status">Sending…</span>}
          {message.failed && <span className="message__status">Failed</span>}
        </div>
      </div>
    </article>
  );
}
