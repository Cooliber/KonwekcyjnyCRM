import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Wifi, 
  WifiOff, 
  Bell, 
  Users, 
  MapPin, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Radio,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

// Type definitions for real-time events
interface JobUpdateData {
  message: string;
  jobId: string;
  status?: string;
  technicianId?: string;
}

interface TechnicianLocationData {
  lat: number;
  lng: number;
  technicianId: string;
  accuracy?: number;
  timestamp?: number;
}

interface EmergencyAlertData {
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  district?: string;
  jobId?: string;
  contactId?: string;
}

interface SystemNotificationData {
  message: string;
  district?: string;
  type?: string;
  metadata?: Record<string, unknown>;
}

type RealtimeEventData = JobUpdateData | TechnicianLocationData | EmergencyAlertData | SystemNotificationData;

interface RealtimeEvent {
  id: string;
  type: 'job_update' | 'technician_location' | 'emergency_alert' | 'system_notification';
  data: RealtimeEventData;
  timestamp: number;
  channel: string;
}

interface SubscriptionChannel {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  eventCount: number;
  lastEvent?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export function RealTimeSubscriptionManager() {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [channels, setChannels] = useState<SubscriptionChannel[]>([
    {
      id: 'job_updates',
      name: 'Job Updates',
      description: 'Real-time job status changes and technician updates',
      isActive: true,
      eventCount: 0,
      icon: Activity,
      color: '#3b82f6'
    },
    {
      id: 'technician_tracking',
      name: 'Technician Tracking',
      description: 'Live GPS location updates from field technicians',
      isActive: true,
      eventCount: 0,
      icon: MapPin,
      color: '#10b981'
    },
    {
      id: 'emergency_alerts',
      name: 'Emergency Alerts',
      description: 'Critical system alerts and emergency notifications',
      isActive: true,
      eventCount: 0,
      icon: AlertTriangle,
      color: '#ef4444'
    },
    {
      id: 'district_updates',
      name: 'District Updates',
      description: 'Warsaw district-specific updates and prophecy alerts',
      isActive: false,
      eventCount: 0,
      icon: Radio,
      color: '#8b5cf6'
    },
    {
      id: 'customer_portal',
      name: 'Customer Portal',
      description: 'Customer interactions and portal activities',
      isActive: false,
      eventCount: 0,
      icon: Users,
      color: '#f59e0b'
    }
  ]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // Mock WebSocket connection - replace with actual Supabase Realtime
  const connectToSupabase = () => {
    try {
      // Mock WebSocket URL - replace with actual Supabase Realtime endpoint
      const wsUrl = 'wss://mock-supabase-realtime.com/websocket';
      
      // In real implementation, use Supabase client:
      // const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      // const channel = supabase.channel('hvac-updates')
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        toast.success('Connected to real-time updates');
        
        // Subscribe to active channels
        channels.filter(c => c.isActive).forEach(channel => {
          // Mock subscription - replace with actual Supabase channel subscription
          console.log(`Subscribing to ${channel.id}`);
        });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeEvent(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        toast.error('Disconnected from real-time updates');
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectToSupabase();
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast.error('Real-time connection error');
      };

    } catch (error) {
      console.error('Failed to connect to Supabase Realtime:', error);
      toast.error('Failed to establish real-time connection');
    }
  };

  const handleRealtimeEvent = (data: {
    type?: string;
    payload?: RealtimeEventData;
    channel?: string;
  } & Partial<RealtimeEventData>) => {
    const eventType = (data.type as RealtimeEvent['type']) || 'system_notification';
    const event: RealtimeEvent = {
      id: Math.random().toString(36).substr(2, 9),
      type: eventType,
      data: data.payload || (data as RealtimeEventData),
      timestamp: Date.now(),
      channel: data.channel || 'general'
    };

    setEvents(prev => [event, ...prev.slice(0, 49)]); // Keep last 50 events

    // Update channel event count
    setChannels(prev => prev.map(channel => {
      if (channel.id === event.channel) {
        return {
          ...channel,
          eventCount: channel.eventCount + 1,
          lastEvent: event.timestamp
        };
      }
      return channel;
    }));

    // Show toast for important events
    if (event.type === 'emergency_alert') {
      toast.error(`Emergency Alert: ${event.data.message}`);
    } else if (event.type === 'job_update') {
      toast.info(`Job Update: ${event.data.message}`);
    }
  };

  const toggleChannel = (channelId: string) => {
    setChannels(prev => prev.map(channel => {
      if (channel.id === channelId) {
        const newActive = !channel.isActive;
        
        // Mock channel subscription toggle
        if (newActive) {
          console.log(`Subscribing to ${channelId}`);
          toast.success(`Subscribed to ${channel.name}`);
        } else {
          console.log(`Unsubscribing from ${channelId}`);
          toast.info(`Unsubscribed from ${channel.name}`);
        }
        
        return { ...channel, isActive: newActive };
      }
      return channel;
    }));
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setIsConnected(false);
  };

  // Simulate real-time events for demo
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        const mockEvents = [
          {
            type: 'job_update',
            channel: 'job_updates',
            payload: { message: 'Technician arrived at Śródmieście location', jobId: 'job_123' }
          },
          {
            type: 'technician_location',
            channel: 'technician_tracking',
            payload: { lat: 52.2297, lng: 21.0122, technicianId: 'tech_456' }
          },
          {
            type: 'system_notification',
            channel: 'district_updates',
            payload: { message: 'High demand predicted in Mokotów district', district: 'Mokotów' }
          }
        ];

        const randomEvent = mockEvents[Math.floor(Math.random() * mockEvents.length)];
        handleRealtimeEvent(randomEvent);
      }
    }, 5000 + Math.random() * 10000); // Random interval between 5-15 seconds

    return () => clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    connectToSupabase();
    
    return () => {
      disconnect();
    };
  }, []);

  const formatEventTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'job_update': return <Activity className="w-4 h-4" />;
      case 'technician_location': return <MapPin className="w-4 h-4" />;
      case 'emergency_alert': return <AlertTriangle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'job_update': return 'text-blue-600';
      case 'technician_location': return 'text-green-600';
      case 'emergency_alert': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Zap className="w-5 h-5 mr-2 text-purple-500" />
              Real-Time Subscriptions
            </div>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <div className="flex items-center text-green-600">
                  <Wifi className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <WifiOff className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">Disconnected</span>
                </div>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={isConnected ? disconnect : connectToSupabase}
              >
                {isConnected ? 'Disconnect' : 'Connect'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map(channel => {
              const Icon = channel.icon;
              return (
                <div
                  key={channel.id}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all cursor-pointer",
                    channel.isActive 
                      ? "border-blue-200 bg-blue-50" 
                      : "border-gray-200 bg-gray-50"
                  )}
                  onClick={() => toggleChannel(channel.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon 
                      className="w-5 h-5" 
                      style={{ color: channel.color }}
                    />
                    <div className="flex items-center space-x-2">
                      {channel.isActive && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      )}
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                        {channel.eventCount}
                      </span>
                    </div>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">{channel.name}</h4>
                  <p className="text-xs text-gray-600">{channel.description}</p>
                  {channel.lastEvent && (
                    <p className="text-xs text-gray-500 mt-2">
                      Last: {formatEventTime(channel.lastEvent)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Event Stream */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Live Event Stream
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Radio className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No events yet. Connect to start receiving real-time updates.</p>
              </div>
            ) : (
              events.map(event => (
                <div key={event.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={cn("mt-0.5", getEventColor(event.type))}>
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {event.type.replace('_', ' ').toUpperCase()}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatEventTime(event.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {event.data.message || JSON.stringify(event.data)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Channel: {event.channel}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
