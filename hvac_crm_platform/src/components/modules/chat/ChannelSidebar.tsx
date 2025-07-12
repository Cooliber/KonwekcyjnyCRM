import {
  AlertTriangle,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Hash,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import type React from "react";
import { useState } from "react";

interface LastMessage {
  _id: string;
  content: string;
  senderId: string;
  senderName?: string;
  timestamp: number;
  type: "text" | "image" | "file" | "audio" | "location" | "system";
}

interface Channel {
  _id: string;
  name: string;
  type:
    | "district"
    | "emergency"
    | "general"
    | "technicians"
    | "sales"
    | "support"
    | "project"
    | "direct";
  district?: string;
  unreadCount: number;
  onlineParticipants: number;
  lastMessage?: LastMessage;
  isUserAdmin: boolean;
  canPost: boolean;
}

interface DistrictChannel {
  name: string;
  affluence: number;
  urgencyMultiplier: number;
  hasChannel: boolean;
  channelId?: string;
  isParticipant: boolean;
}

interface ChannelSidebarProps {
  channels: Channel[];
  districtChannels: DistrictChannel[];
  activeChannelId: string;
  onChannelSelect: (channelId: string) => void;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  channels,
  districtChannels,
  activeChannelId,
  onChannelSelect,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    general: true,
    districts: true,
    projects: true,
    direct: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case "general":
      case "technicians":
      case "sales":
      case "support":
        return <Hash className="w-4 h-4" />;
      case "emergency":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "district":
        return <MapPin className="w-4 h-4 text-blue-500" />;
      case "project":
        return <Briefcase className="w-4 h-4 text-green-500" />;
      case "direct":
        return <MessageCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <Hash className="w-4 h-4" />;
    }
  };

  const getAffluenceColor = (affluence: number) => {
    if (affluence >= 8) return "text-green-600 bg-green-100";
    if (affluence >= 6) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const formatLastMessage = (message: any) => {
    if (!message) return "";

    const content =
      message.content.length > 30 ? `${message.content.substring(0, 30)}...` : message.content;

    return `${message.sender?.profile?.firstName || "Someone"}: ${content}`;
  };

  // Group channels by type
  const generalChannels = channels.filter((ch) =>
    ["general", "technicians", "sales", "support", "emergency"].includes(ch.type)
  );
  const districtChannelsActive = channels.filter((ch) => ch.type === "district");
  const projectChannels = channels.filter((ch) => ch.type === "project");
  const directChannels = channels.filter((ch) => ch.type === "direct");

  const ChannelItem: React.FC<{ channel: Channel }> = ({ channel }) => (
    <button
      onClick={() => onChannelSelect(channel.name)}
      className={`
        w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors
        ${
          activeChannelId === channel.name
            ? "bg-blue-100 text-blue-900 border border-blue-200"
            : "hover:bg-gray-100 text-gray-700"
        }
      `}
    >
      <div className="flex items-center flex-1 min-w-0">
        {getChannelIcon(channel.type)}
        <span className="ml-2 text-sm font-medium truncate">
          {channel.name.replace(/^(district-|project-|direct-)/, "")}
        </span>
        {channel.district && (
          <span className="ml-1 text-xs text-gray-500">({channel.district})</span>
        )}
      </div>

      <div className="flex items-center space-x-1">
        {channel.onlineParticipants > 0 && (
          <span className="text-xs text-gray-500">{channel.onlineParticipants}</span>
        )}
        {channel.unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
            {channel.unreadCount > 99 ? "99+" : channel.unreadCount}
          </span>
        )}
      </div>
    </button>
  );

  const SectionHeader: React.FC<{
    title: string;
    section: keyof typeof expandedSections;
    count?: number;
    onAdd?: () => void;
  }> = ({ title, section, count, onAdd }) => (
    <div className="flex items-center justify-between px-2 py-1">
      <button
        onClick={() => toggleSection(section)}
        className="flex items-center text-xs font-semibold text-gray-600 uppercase tracking-wide hover:text-gray-800"
      >
        {expandedSections[section] ? (
          <ChevronDown className="w-3 h-3 mr-1" />
        ) : (
          <ChevronRight className="w-3 h-3 mr-1" />
        )}
        {title}
        {count !== undefined && <span className="ml-1 text-gray-400">({count})</span>}
      </button>
      {onAdd && (
        <button
          onClick={onAdd}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
          title={`Add ${title}`}
        >
          <Plus className="w-3 h-3" />
        </button>
      )}
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* General Channels */}
        <div>
          <SectionHeader title="Channels" section="general" count={generalChannels.length} />
          {expandedSections.general && (
            <div className="space-y-1 mt-2">
              {generalChannels.map((channel) => (
                <ChannelItem key={channel._id} channel={channel} />
              ))}
            </div>
          )}
        </div>

        {/* Warsaw Districts */}
        <div>
          <SectionHeader
            title="Warsaw Districts"
            section="districts"
            count={districtChannels.length}
          />
          {expandedSections.districts && (
            <div className="space-y-1 mt-2">
              {districtChannels.map((district) => {
                const activeChannel = districtChannelsActive.find(
                  (ch) => ch.district === district.name
                );

                return (
                  <div key={district.name} className="space-y-1">
                    {/* District Info */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-blue-500 mr-2" />
                        <span className="text-sm font-medium">{district.name}</span>
                        <span
                          className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${getAffluenceColor(district.affluence)}`}
                        >
                          {district.affluence}/10
                        </span>
                      </div>
                      {district.urgencyMultiplier > 1.2 && (
                        <AlertTriangle
                          className="w-4 h-4 text-orange-500"
                          title="High Priority District"
                        />
                      )}
                    </div>

                    {/* District Channel */}
                    {activeChannel && <ChannelItem channel={activeChannel} />}

                    {!district.hasChannel && (
                      <button className="w-full p-2 text-xs text-gray-500 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-700">
                        Create {district.name} Channel
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Project Channels */}
        {projectChannels.length > 0 && (
          <div>
            <SectionHeader title="Projects" section="projects" count={projectChannels.length} />
            {expandedSections.projects && (
              <div className="space-y-1 mt-2">
                {projectChannels.map((channel) => (
                  <div key={channel._id}>
                    <ChannelItem channel={channel} />
                    {channel.lastMessage && (
                      <div className="ml-6 text-xs text-gray-500 truncate">
                        {formatLastMessage(channel.lastMessage)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Direct Messages */}
        {directChannels.length > 0 && (
          <div>
            <SectionHeader title="Direct Messages" section="direct" count={directChannels.length} />
            {expandedSections.direct && (
              <div className="space-y-1 mt-2">
                {directChannels.map((channel) => (
                  <div key={channel._id}>
                    <ChannelItem channel={channel} />
                    {channel.lastMessage && (
                      <div className="ml-6 text-xs text-gray-500 truncate">
                        {formatLastMessage(channel.lastMessage)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-4 border-t border-gray-200">
          <div className="space-y-2">
            <button className="w-full flex items-center p-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              <Phone className="w-4 h-4 mr-2" />
              Start Voice Call
            </button>
            <button className="w-full flex items-center p-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              <Users className="w-4 h-4 mr-2" />
              Create Channel
            </button>
            <button className="w-full flex items-center p-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              <Settings className="w-4 h-4 mr-2" />
              Chat Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelSidebar;
