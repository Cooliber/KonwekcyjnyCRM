import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCheck,
  Clock,
  Filter,
  MapPin,
  MessageSquare,
  Settings,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const [filter, setFilter] = useState<{
    priority?: string;
    type?: string;
    district?: string;
    unreadOnly: boolean;
  }>({
    unreadOnly: false,
  });

  // Queries
  const notifications = useQuery(api.notifications.list, {
    unreadOnly: filter.unreadOnly,
    priority: filter.priority as any,
    type: filter.type,
    district: filter.district,
    limit: 50,
  });

  // Mutations
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  // Auto-request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead({ id: notificationId });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead({});
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const getNotificationIcon = (type: string, priority: string) => {
    if (priority === "urgent" || type === "emergency") {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }

    switch (type) {
      case "message":
      case "urgent_message":
      case "mention":
      case "thread_reply":
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case "district_alert":
      case "route_update":
        return <MapPin className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "border-l-red-500 bg-red-50";
      case "high":
        return "border-l-orange-500 bg-orange-50";
      case "medium":
        return "border-l-blue-500 bg-blue-50";
      case "low":
        return "border-l-gray-500 bg-gray-50";
      default:
        return "border-l-gray-500 bg-gray-50";
    }
  };

  const formatNotificationTime = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end z-50">
      <div className="bg-white w-96 h-full shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {unreadCount}
                </span>
              )}
            </div>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 flex items-center"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark all read
            </button>
            <button
              onClick={() => setFilter((prev) => ({ ...prev, unreadOnly: !prev.unreadOnly }))}
              className={`text-sm flex items-center px-2 py-1 rounded ${
                filter.unreadOnly
                  ? "bg-blue-100 text-blue-800"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Filter className="w-4 h-4 mr-1" />
              {filter.unreadOnly ? "Show all" : "Unread only"}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-3 gap-2">
            <select
              value={filter.priority || ""}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, priority: e.target.value || undefined }))
              }
              className="text-xs p-2 border border-gray-300 rounded"
            >
              <option value="">All Priorities</option>
              <option value="urgent">🔴 Urgent</option>
              <option value="high">🟡 High</option>
              <option value="medium">🔵 Medium</option>
              <option value="low">⚪ Low</option>
            </select>

            <select
              value={filter.type || ""}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, type: e.target.value || undefined }))
              }
              className="text-xs p-2 border border-gray-300 rounded"
            >
              <option value="">All Types</option>
              <option value="emergency">Emergency</option>
              <option value="message">Messages</option>
              <option value="job_assigned">Jobs</option>
              <option value="district_alert">District</option>
            </select>

            <select
              value={filter.district || ""}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, district: e.target.value || undefined }))
              }
              className="text-xs p-2 border border-gray-300 rounded"
            >
              <option value="">All Districts</option>
              <option value="Śródmieście">Śródmieście</option>
              <option value="Wilanów">Wilanów</option>
              <option value="Mokotów">Mokotów</option>
              <option value="Żoliborz">Żoliborz</option>
            </select>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications && notifications.length > 0 ? (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`
                    p-4 border-l-4 cursor-pointer hover:bg-gray-50 transition-colors
                    ${getPriorityColor(notification.priority)}
                    ${!notification.read ? "font-medium" : "opacity-75"}
                  `}
                  onClick={() => {
                    if (!notification.read) {
                      handleMarkAsRead(notification._id);
                    }
                    if (notification.actionUrl) {
                      window.location.href = notification.actionUrl;
                    }
                  }}
                >
                  <div className="flex items-start">
                    <div className="mr-3 mt-1">
                      {getNotificationIcon(notification.type, notification.priority)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2" />
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.personalizedContent || notification.message}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatNotificationTime(notification._creationTime)}</span>

                          {notification.districtContext?.district && (
                            <>
                              <MapPin className="w-3 h-3" />
                              <span>{notification.districtContext.district}</span>
                            </>
                          )}
                        </div>

                        {notification.aiGenerated && (
                          <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                            AI
                          </span>
                        )}
                      </div>

                      {/* Delivery Status */}
                      <div className="flex items-center mt-2 space-x-1">
                        {notification.pushSent && (
                          <span className="text-xs text-green-600">📱</span>
                        )}
                        {notification.emailSent && (
                          <span className="text-xs text-blue-600">📧</span>
                        )}
                        {notification.smsSent && (
                          <span className="text-xs text-orange-600">📱</span>
                        )}
                        {notification.telegramSent && (
                          <span className="text-xs text-blue-600">✈️</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <BellOff className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => {
              /* Open notification settings */
            }}
            className="w-full flex items-center justify-center p-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
          >
            <Settings className="w-4 h-4 mr-2" />
            Notification Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
