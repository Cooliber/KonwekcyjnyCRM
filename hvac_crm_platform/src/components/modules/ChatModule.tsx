import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { MessageBubble } from './chat/MessageBubble';
import { MessageInput } from './chat/MessageInput';
import { ChannelSidebar } from './chat/ChannelSidebar';
import { ThreadPanel } from './chat/ThreadPanel';
import { EmergencyAlert } from './chat/EmergencyAlert';
import { DistrictNotifications } from './chat/DistrictNotifications';
import { MessageSquare, Users, AlertTriangle, MapPin, Phone } from 'lucide-react';

interface ChatModuleProps {
  initialChannelId?: string;
  jobId?: string;
  contactId?: string;
}

export const ChatModule: React.FC<ChatModuleProps> = ({
  initialChannelId,
  jobId,
  contactId
}) => {
  const [activeChannelId, setActiveChannelId] = useState(initialChannelId || 'general');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [showEmergencyPanel, setShowEmergencyPanel] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries
  const channels = useQuery(api.conversationChannels.list, {});
  const messages = useQuery(api.messages.list, {
    channelId: activeChannelId,
    jobId,
    contactId,
    includeThreads: true,
    limit: 50
  });
  const districtChannels = useQuery(api.conversationChannels.getDistrictChannels, {});
  const threadMessages = activeThreadId 
    ? useQuery(api.messages.getThread, { threadId: activeThreadId })
    : null;

  // Mutations
  const sendMessage = useMutation(api.messages.send);
  const sendUrgentMessage = useMutation(api.messages.sendUrgentMessage);
  const startThread = useMutation(api.messages.startThread);
  const markAsRead = useMutation(api.messages.markAsRead);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when channel changes
  useEffect(() => {
    if (messages && messages.length > 0) {
      const unreadMessages = messages.filter(msg => !msg.isRead);
      unreadMessages.forEach(msg => {
        markAsRead({ messageId: msg._id });
      });
    }
  }, [activeChannelId, messages, markAsRead]);

  const handleSendMessage = async (content: string, options?: {
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    mentions?: string[];
    location?: { lat: number; lng: number; address?: string };
    scheduledFor?: number;
  }) => {
    if (!content.trim()) return;

    try {
      await sendMessage({
        content: content.trim(),
        channelId: activeChannelId,
        jobId,
        contactId,
        priority: options?.priority || 'normal',
        mentions: options?.mentions,
        location: options?.location,
        scheduledFor: options?.scheduledFor,
        // Add district context if in district channel
        districtContext: selectedDistrict ? {
          district: selectedDistrict,
          urgencyLevel: options?.priority === 'urgent' ? 'emergency' : 'medium',
          routeOptimized: false
        } : undefined
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleSendUrgentMessage = async (content: string, district: string) => {
    try {
      await sendUrgentMessage({
        content,
        district,
        urgencyLevel: 'emergency',
        estimatedResponseTime: 15 // 15 minutes for emergency response
      });
      setShowEmergencyPanel(false);
    } catch (error) {
      console.error('Failed to send urgent message:', error);
    }
  };

  const handleStartThread = async (messageId: string, reply: string) => {
    try {
      const result = await startThread({
        messageId,
        initialReply: reply
      });
      setActiveThreadId(result.threadId);
    } catch (error) {
      console.error('Failed to start thread:', error);
    }
  };

  const handleChannelChange = (channelId: string) => {
    setActiveChannelId(channelId);
    setActiveThreadId(null);
    
    // Set district context if it's a district channel
    const channel = channels?.find(ch => ch.name === channelId);
    if (channel?.type === 'district') {
      setSelectedDistrict(channel.district || null);
    } else {
      setSelectedDistrict(null);
    }
  };

  return (
    <div className="flex h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Channel Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
              Team Chat
            </h2>
            <button
              onClick={() => setShowEmergencyPanel(true)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Send Emergency Alert"
            >
              <AlertTriangle className="w-5 h-5" />
            </button>
          </div>
        </div>

        <ChannelSidebar
          channels={channels || []}
          districtChannels={districtChannels || []}
          activeChannelId={activeChannelId}
          onChannelSelect={handleChannelChange}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {channels?.find(ch => ch.name === activeChannelId)?.name || activeChannelId}
              </h3>
              {selectedDistrict && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {selectedDistrict}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {channels?.find(ch => ch.name === activeChannelId)?.onlineParticipants || 0} online
              </span>
              {jobId && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Job Chat
                </span>
              )}
            </div>
          </div>
        </div>

        {/* District Notifications */}
        {selectedDistrict && (
          <DistrictNotifications district={selectedDistrict} />
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages?.map((message) => (
            <MessageBubble
              key={message._id}
              message={message}
              onStartThread={(reply) => handleStartThread(message._id, reply)}
              onOpenThread={() => setActiveThreadId(message.threadId || null)}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 p-4">
          <MessageInput
            onSendMessage={handleSendMessage}
            placeholder={`Message ${activeChannelId}...`}
            allowVoiceNotes={true}
            allowFileUpload={true}
            showDistrictContext={!!selectedDistrict}
            district={selectedDistrict}
          />
        </div>
      </div>

      {/* Thread Panel */}
      {activeThreadId && (
        <ThreadPanel
          threadId={activeThreadId}
          messages={threadMessages || []}
          onClose={() => setActiveThreadId(null)}
          onSendMessage={(content) => 
            sendMessage({
              content,
              threadId: activeThreadId,
              channelId: activeChannelId
            })
          }
        />
      )}

      {/* Emergency Alert Panel */}
      {showEmergencyPanel && (
        <EmergencyAlert
          districts={districtChannels?.map(d => d.name) || []}
          onSendUrgent={handleSendUrgentMessage}
          onClose={() => setShowEmergencyPanel(false)}
        />
      )}
    </div>
  );
};

export default ChatModule;
