import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  Check,
  CheckCheck,
  Clock,
  Download,
  MapPin,
  MessageCircle,
  Pause,
  Play,
  Reply,
} from "lucide-react";
import type React from "react";
import { useState } from "react";

// Type definitions for message data
interface MessageMetadata {
  mentions?: string[];
  hashtags?: string[];
  links?: string[];
  quotedMessage?: string;
  duration?: number;
  fileSize?: number;
  fileName?: string;
}

interface MessageLocation {
  address?: string;
  accuracy?: number;
  lat: number;
  lng: number;
}

interface Message {
  _id: string;
  content: string;
  senderId: string;
  senderName?: string;
  timestamp: number;
  type: "text" | "image" | "file" | "audio" | "location" | "system";
  metadata?: MessageMetadata;
  location?: MessageLocation;
  priority?: "low" | "high" | "urgent" | "normal";
  threadId?: string;
  threadCount?: number;
  isThreadStarter?: boolean;
  reactions?: Record<string, string[]>;
  edited?: boolean;
  editedAt?: number;
}

interface MessageBubbleProps {
  message: Message;
  onStartThread: (reply: string) => void;
  onOpenThread: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onStartThread,
  onOpenThread,
}) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  const isCurrentUser = false; // Would check against current user ID
  const isUrgent = message.priority === "urgent" || message.type === "urgent_alert";
  const isEmergency = message.districtContext?.urgencyLevel === "emergency";

  const handleStartThread = () => {
    if (replyText.trim()) {
      onStartThread(replyText.trim());
      setReplyText("");
      setShowReplyInput(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const getMessageIcon = () => {
    switch (message.type) {
      case "urgent_alert":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "system":
        return <Clock className="w-4 h-4 text-gray-500" />;
      case "voice_note":
        return isPlayingVoice ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />;
      case "location":
        return <MapPin className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getDeliveryStatus = () => {
    if (message.readBy && message.readBy.length > 1) {
      return <CheckCheck className="w-4 h-4 text-blue-500" title="Read by others" />;
    } else if (message.deliveredToUser) {
      return <Check className="w-4 h-4 text-gray-500" title="Delivered" />;
    }
    return null;
  };

  return (
    <div className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} group`}>
      <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? "order-2" : "order-1"}`}>
        {/* Message Container */}
        <div
          className={`
            relative px-4 py-2 rounded-lg shadow-sm
            ${
              isCurrentUser
                ? "bg-blue-600 text-white"
                : isEmergency
                  ? "bg-red-100 border-2 border-red-300 text-red-900"
                  : isUrgent
                    ? "bg-orange-100 border border-orange-300 text-orange-900"
                    : "bg-gray-100 text-gray-900"
            }
            ${message.threadId ? "border-l-4 border-blue-500 ml-4" : ""}
          `}
        >
          {/* Sender Info */}
          {!isCurrentUser && (
            <div className="flex items-center mb-1">
              <span className="text-xs font-medium">
                {message.sender?.profile?.firstName} {message.sender?.profile?.lastName}
              </span>
              {message.sender?.profile?.role && (
                <span className="ml-2 px-1 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                  {message.sender.profile.role}
                </span>
              )}
            </div>
          )}

          {/* Reply Context */}
          {message.replyTo && (
            <div className="mb-2 p-2 bg-black bg-opacity-10 rounded text-xs">
              <div className="flex items-center">
                <Reply className="w-3 h-3 mr-1" />
                Replying to: {message.replyTo.content.substring(0, 50)}...
              </div>
            </div>
          )}

          {/* Message Content */}
          <div className="flex items-start">
            {getMessageIcon() && <div className="mr-2 mt-0.5">{getMessageIcon()}</div>}
            <div className="flex-1">
              {/* Text Content */}
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>

              {/* File Attachment */}
              {message.fileUrl && message.type === "file" && (
                <div className="mt-2 p-2 bg-black bg-opacity-10 rounded flex items-center">
                  <Download className="w-4 h-4 mr-2" />
                  <a
                    href={message.fileUrl}
                    download={message.fileName}
                    className="text-sm underline hover:no-underline"
                  >
                    {message.fileName}
                  </a>
                </div>
              )}

              {/* Image Attachment */}
              {message.fileUrl && message.type === "image" && (
                <div className="mt-2">
                  <img
                    src={message.fileUrl}
                    alt={message.fileName}
                    className="max-w-full h-auto rounded"
                  />
                </div>
              )}

              {/* Voice Note */}
              {message.type === "voice_note" && (
                <div className="mt-2 flex items-center space-x-2">
                  <button
                    onClick={() => setIsPlayingVoice(!isPlayingVoice)}
                    className="p-2 bg-black bg-opacity-10 rounded-full hover:bg-opacity-20"
                  >
                    {isPlayingVoice ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 h-2 bg-black bg-opacity-10 rounded">
                    <div className="h-full bg-current rounded" style={{ width: "30%" }} />
                  </div>
                  <span className="text-xs">{message.metadata?.duration || 0}s</span>
                </div>
              )}

              {/* Location */}
              {message.location && (
                <div className="mt-2 p-2 bg-black bg-opacity-10 rounded">
                  <div className="flex items-center text-xs">
                    <MapPin className="w-3 h-3 mr-1" />
                    {message.location.address || `${message.location.lat}, ${message.location.lng}`}
                  </div>
                </div>
              )}

              {/* District Context */}
              {message.districtInfo && (
                <div className="mt-2 text-xs">
                  <span className="px-2 py-1 bg-black bg-opacity-10 rounded">
                    📍 {message.districtInfo.district}
                    {message.districtInfo.isHighPriority && (
                      <span className="ml-1 text-red-500">🚨</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Message Footer */}
          <div className="flex items-center justify-between mt-2 text-xs opacity-70">
            <span>{formatTime(message._creationTime)}</span>
            <div className="flex items-center space-x-1">
              {getDeliveryStatus()}
              {message.threadInfo && (
                <button
                  onClick={onOpenThread}
                  className="flex items-center hover:opacity-100 transition-opacity"
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  {message.threadInfo.messageCount}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center mt-1 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowReplyInput(!showReplyInput)}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
          >
            <Reply className="w-3 h-3 mr-1" />
            Reply
          </button>
          {message.threadInfo && (
            <button
              onClick={onOpenThread}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
            >
              <MessageCircle className="w-3 h-3 mr-1" />
              Thread ({message.threadInfo.messageCount})
            </button>
          )}
        </div>

        {/* Reply Input */}
        {showReplyInput && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Start a thread..."
              className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
              rows={2}
            />
            <div className="flex justify-end space-x-2 mt-2">
              <button
                onClick={() => setShowReplyInput(false)}
                className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleStartThread}
                disabled={!replyText.trim()}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Start Thread
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Avatar */}
      {!isCurrentUser && (
        <div className="order-1 mr-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
            {message.sender?.profile?.firstName?.[0]}
            {message.sender?.profile?.lastName?.[0]}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
