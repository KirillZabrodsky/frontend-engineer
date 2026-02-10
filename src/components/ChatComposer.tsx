type ChatComposerProps = {
  draft: string;
  isSending: boolean;
  canSend: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => void;
};

export function ChatComposer({
  draft,
  isSending,
  canSend,
  onDraftChange,
  onSend
}: ChatComposerProps) {
  return (
    <div className="chat-input">
      <form
        className="composer"
        onSubmit={(event) => {
          event.preventDefault();
          onSend();
        }}
      >
        <input
          className="composer__input"
          type="text"
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="Message"
          autoComplete="off"
          required
        />
        <button className="send-button" type="submit" disabled={!canSend}>
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
