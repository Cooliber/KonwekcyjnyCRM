import { MessageCircle, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

// Import Message type from MessageBubble
interface ThreadMessage {
  _id: string;
  content: string;
  senderId: string;
  senderName?: string;
  timestamp: number;
  type: "text" | "image" | "file" | "audio" | "location" | "system";
  isThreadStarter?: boolean;
  threadId?: string;
  reactions?: Record<string, string[]>;
  edited?: boolean;
  editedAt?: number;
}

interface ThreadPanelProps {
  threadId: string;
  messages: ThreadMessage[];
  onClose: () => void;
  onSendMessage: (content: string) => void;
}

export const ThreadPanel: React.FC<ThreadPanelProps> = ({
  threadId,
  messages,
  onClose,
  onSendMessage,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const threadStarter = messages.find((msg) => msg.isThreadStarter);
  const replies = messages.filter((msg) => !msg.isThreadStarter);

  return (
    <div className="w-96 border-l border-gray-200 bg-white flex flex-col">
      {/* Thread Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MessageCircle className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Thread</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {replies.length} {replies.length === 1 ? "reply" : "replies"}
        </p>
      </div>

      {/* Thread Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Original Message */}
        {threadStarter && (
          <div className="pb-4 border-b border-gray-100">
            <MessageBubble
              message={threadStarter}
              onStartThread={() => {}}
              onOpenThread={() => {}}
            />
          </div>
        )}

        {/* Thread Replies */}
        {replies.map((message) => (
          <MessageBubble
            key={message._id}
            message={message}
            onStartThread={() => {}}
            onOpenThread={() => {}}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Thread Input */}
      <div className="border-t border-gray-200 p-4">
        <MessageInput
          onSendMessage={(content) => onSendMessage(content)}
          placeholder="Reply to thread..."
          allowVoiceNotes={true}
          allowFileUpload={true}
        />
      </div>
    </div>
  );
};

export default ThreadPanel;
