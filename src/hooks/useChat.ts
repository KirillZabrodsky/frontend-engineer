import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type RefObject
} from 'react';
import {
  DEFAULT_BASE_URL,
  DEFAULT_TOKEN,
  fetchMessages,
  sendMessage
} from '../api';
import { CURRENT_AUTHOR } from '../constants';
import type { Message } from '../types';
import { mergeMessages, normalizeMessage, sortMessages } from '../utils';

const MESSAGE_LIMIT = 40;
const POLL_INTERVAL = 5000;

export type ChatStatus = 'idle' | 'loading' | 'ready' | 'error';

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong.';
};

const createOptimisticMessage = (message: string): Message => {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    id: `optimistic-${id}`,
    author: CURRENT_AUTHOR,
    message,
    createdAt: new Date().toISOString(),
    pending: true
  };
};

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

export function useChat(): UseChatResult {
  const apiBaseUrl = DEFAULT_BASE_URL;
  const token = DEFAULT_TOKEN;

  // UI state
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [hasOlder, setHasOlder] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const listRef = useRef<HTMLDivElement | null>(null);
  const isAtBottom = useRef(true);
  const previousCount = useRef(0);

  // Derived values based on the current message list.
  const latestTimestamp = messages.length ? messages[messages.length - 1].createdAt : null;
  const oldestTimestamp = messages.length ? messages[0].createdAt : null;
  const canSend = Boolean(draft.trim()) && Boolean(apiBaseUrl) && Boolean(token) && !isSending;

  const scrollToBottom = useCallback(() => {
    const element = listRef.current;
    if (!element) {
      return;
    }
    element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    // Track whether the user is near the bottom to manage auto-scroll and unread count.
    const element = listRef.current;
    if (!element) {
      return;
    }

    const update = () => {
      const threshold = 80;
      const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
      isAtBottom.current = distanceFromBottom < threshold;
      if (isAtBottom.current) {
        setUnreadCount(0);
      }
    };

    update();
    element.addEventListener('scroll', update);
    return () => element.removeEventListener('scroll', update);
  }, []);

  useEffect(() => {
    // Auto-scroll only if the user hasn't scrolled up; otherwise accumulate unread count.
    if (messages.length > previousCount.current) {
      const added = messages.length - previousCount.current;
      if (isAtBottom.current) {
        scrollToBottom();
      } else {
        setUnreadCount((count) => count + added);
      }
    }
    previousCount.current = messages.length;
  }, [messages, scrollToBottom]);

  const loadInitial = useCallback(
    async (signal?: AbortSignal) => {
      // Initial sync: fetch the latest page of messages.
      if (!apiBaseUrl || !token) {
        setStatus('error');
        setError('Set your API base URL and token to load messages.');
        return;
      }

      setStatus('loading');
      setError(null);
      try {
        const raw = await fetchMessages({
          baseUrl: apiBaseUrl,
          token,
          limit: MESSAGE_LIMIT,
          signal
        });
        const normalized = raw.map(normalizeMessage);
        setMessages(sortMessages(normalized));
        setHasOlder(raw.length >= MESSAGE_LIMIT);
        setStatus('ready');
        setTimeout(scrollToBottom, 50);
      } catch (err) {
        setStatus('error');
        setError(toErrorMessage(err));
      }
    },
    [apiBaseUrl, token, scrollToBottom]
  );

  const loadNewer = useCallback(async () => {
    // Poll for any messages newer than the last one we have.
    if (!latestTimestamp) {
      return;
    }
    try {
      const raw = await fetchMessages({
        baseUrl: apiBaseUrl,
        token,
        after: latestTimestamp,
        limit: MESSAGE_LIMIT
      });
      if (raw.length) {
        const normalized = raw.map(normalizeMessage);
        setMessages((current) => mergeMessages(current, normalized));
      }
    } catch (err) {
      setError(toErrorMessage(err));
    }
  }, [apiBaseUrl, token, latestTimestamp]);

  const loadOlder = useCallback(async () => {
    // Fetch older messages for "load earlier" UX.
    if (!oldestTimestamp) {
      return;
    }
    setIsLoadingOlder(true);
    try {
      const raw = await fetchMessages({
        baseUrl: apiBaseUrl,
        token,
        before: oldestTimestamp,
        limit: MESSAGE_LIMIT
      });
      if (raw.length) {
        const normalized = raw.map(normalizeMessage);
        setMessages((current) => mergeMessages(current, normalized));
        setHasOlder(raw.length >= MESSAGE_LIMIT);
      } else {
        setHasOlder(false);
      }
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setIsLoadingOlder(false);
    }
  }, [apiBaseUrl, token, oldestTimestamp]);

  const send = useCallback(async () => {
    // Send a message with optimistic UI, then reconcile with server response.
    const messageText = draft.trim();
    if (!messageText) {
      return;
    }

    if (!apiBaseUrl || !token) {
      setError('Set your API base URL and token before sending.');
      return;
    }

    // Optimistically append the message while the request is in-flight.
    const optimistic = createOptimisticMessage(messageText);
    setDraft('');
    setMessages((current) => mergeMessages(current, [optimistic]));
    setIsSending(true);

    try {
      const result = await sendMessage({
        baseUrl: apiBaseUrl,
        token,
        message: messageText,
        author: CURRENT_AUTHOR
      });

      if (result) {
        const normalized = normalizeMessage(result);
        setMessages((current) =>
          mergeMessages(
            current.filter((message) => message.id !== optimistic.id),
            [normalized]
          )
        );
      } else {
        await loadNewer();
      }
    } catch (err) {
      setError(toErrorMessage(err));
      setMessages((current) =>
        current.map((message) =>
          message.id === optimistic.id ? { ...message, pending: false, failed: true } : message
        )
      );
    } finally {
      setIsSending(false);
      setTimeout(scrollToBottom, 50);
    }
  }, [apiBaseUrl, token, draft, loadNewer, scrollToBottom]);

  useEffect(() => {
    // Initial load on mount; abort if the component unmounts.
    const controller = new AbortController();
    void loadInitial(controller.signal);
    return () => controller.abort();
  }, [loadInitial]);

  useEffect(() => {
    if (status !== 'ready') {
      return;
    }

    // Poll for new messages while connected.
    const id = window.setInterval(() => {
      void loadNewer();
    }, POLL_INTERVAL);

    return () => window.clearInterval(id);
  }, [status, loadNewer]);

  return {
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
  };
}
