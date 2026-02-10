import { ChatLayout } from './components/ChatLayout';
import { useChat } from './hooks/useChat';

export default function App() {
  const chat = useChat();
  return <ChatLayout {...chat} />;
}
