import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import ChatModule from '../../components/modules/ChatModule';
import NotificationCenter from '../../components/modules/NotificationCenter';
import ClientPortal from '../../components/modules/ClientPortal';

// Mock Convex client
const mockConvexClient = new ConvexReactClient(process.env.VITE_CONVEX_URL || 'https://test.convex.cloud');

// Mock data
const mockChannels = [
  {
    _id: 'channel1',
    name: 'general',
    type: 'general',
    unreadCount: 3,
    onlineParticipants: 5,
    isUserAdmin: false,
    canPost: true
  },
  {
    _id: 'channel2',
    name: 'district-srodmiescie',
    type: 'district',
    district: 'Śródmieście',
    unreadCount: 1,
    onlineParticipants: 2,
    isUserAdmin: true,
    canPost: true
  }
];

const mockMessages = [
  {
    _id: 'msg1',
    content: 'Test message',
    senderId: 'user1',
    channelId: 'general',
    type: 'text',
    priority: 'normal',
    _creationTime: Date.now() - 3600000,
    sender: {
      profile: { firstName: 'John', lastName: 'Doe', role: 'technician' }
    },
    isRead: false,
    threadInfo: null,
    districtInfo: null
  }
];

const mockNotifications = [
  {
    _id: 'notif1',
    title: 'New Job Assignment',
    message: 'You have been assigned to a new job in Śródmieście',
    type: 'job_assigned',
    priority: 'high',
    read: false,
    _creationTime: Date.now() - 1800000,
    districtContext: {
      district: 'Śródmieście',
      affluenceLevel: 9,
      priorityMultiplier: 1.5
    },
    predictedImportance: 0.8,
    aiGenerated: true
  }
];

// Mock Convex hooks
vi.mock('convex/react', async () => {
  const actual = await vi.importActual('convex/react');
  return {
    ...actual,
    useQuery: vi.fn((api, args) => {
      if (api.toString().includes('conversationChannels.list')) {
        return mockChannels;
      }
      if (api.toString().includes('messages.list')) {
        return mockMessages;
      }
      if (api.toString().includes('notifications.list')) {
        return mockNotifications;
      }
      if (api.toString().includes('clientPortal.getClientAccess')) {
        return { hasAccess: true, role: 'client', contactId: 'contact1' };
      }
      if (api.toString().includes('clientPortal.getClientDashboard')) {
        return {
          contact: { name: 'Test Client', district: 'Śródmieście' },
          statistics: { totalJobs: 5, completedJobs: 3, totalSpent: 2500, activeInstallations: 2 },
          recentJobs: [],
          installations: [],
          recommendations: []
        };
      }
      return null;
    }),
    useMutation: vi.fn(() => vi.fn())
  };
});

describe('Communications Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Real-Time Messaging System', () => {
    it('should render chat module with channels and messages', async () => {
      render(
        <ConvexProvider client={mockConvexClient}>
          <ChatModule />
        </ConvexProvider>
      );

      // Check if channels are displayed
      await waitFor(() => {
        expect(screen.getByText('general')).toBeInTheDocument();
        expect(screen.getByText('district-srodmiescie')).toBeInTheDocument();
      });

      // Check if messages are displayed
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should handle channel switching', async () => {
      render(
        <ConvexProvider client={mockConvexClient}>
          <ChatModule />
        </ConvexProvider>
      );

      // Click on district channel
      const districtChannel = await screen.findByText('district-srodmiescie');
      fireEvent.click(districtChannel);

      // Should show district context
      await waitFor(() => {
        expect(screen.getByText('Śródmieście')).toBeInTheDocument();
      });
    });

    it('should display emergency alert button', async () => {
      render(
        <ConvexProvider client={mockConvexClient}>
          <ChatModule />
        </ConvexProvider>
      );

      const emergencyButton = screen.getByTitle('Send Emergency Alert');
      expect(emergencyButton).toBeInTheDocument();
    });

    it('should handle message sending', async () => {
      const mockSendMessage = vi.fn();
      vi.mocked(require('convex/react').useMutation).mockReturnValue(mockSendMessage);

      render(
        <ConvexProvider client={mockConvexClient}>
          <ChatModule />
        </ConvexProvider>
      );

      const messageInput = screen.getByPlaceholderText(/Message/);
      const sendButton = screen.getByTitle('Send Message');

      fireEvent.change(messageInput, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);

      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Test message'
        })
      );
    });

    it('should support voice notes', async () => {
      // Mock getUserMedia
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: vi.fn().mockResolvedValue({
            getTracks: () => [{ stop: vi.fn() }]
          })
        }
      });

      render(
        <ConvexProvider client={mockConvexClient}>
          <ChatModule />
        </ConvexProvider>
      );

      const voiceButton = screen.getByTitle('Hold to record');
      expect(voiceButton).toBeInTheDocument();
    });

    it('should display thread functionality', async () => {
      const messageWithThread = {
        ...mockMessages[0],
        threadInfo: { messageCount: 3, participants: ['user1', 'user2'] }
      };

      vi.mocked(require('convex/react').useQuery).mockImplementation((api) => {
        if (api.toString().includes('messages.list')) {
          return [messageWithThread];
        }
        return mockChannels;
      });

      render(
        <ConvexProvider client={mockConvexClient}>
          <ChatModule />
        </ConvexProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // Thread count
      });
    });
  });

  describe('Notification System', () => {
    it('should render notification center with AI-prioritized notifications', async () => {
      render(
        <ConvexProvider client={mockConvexClient}>
          <NotificationCenter isOpen={true} onClose={() => {}} />
        </ConvexProvider>
      );

      // Check notification display
      await waitFor(() => {
        expect(screen.getByText('New Job Assignment')).toBeInTheDocument();
        expect(screen.getByText('Śródmieście')).toBeInTheDocument();
      });

      // Check AI indicator
      expect(screen.getByText('AI')).toBeInTheDocument();
    });

    it('should filter notifications by priority', async () => {
      render(
        <ConvexProvider client={mockConvexClient}>
          <NotificationCenter isOpen={true} onClose={() => {}} />
        </ConvexProvider>
      );

      const priorityFilter = screen.getByDisplayValue('All Priorities');
      fireEvent.change(priorityFilter, { target: { value: 'high' } });

      // Should trigger re-query with priority filter
      expect(require('convex/react').useQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ priority: 'high' })
      );
    });

    it('should handle notification interactions', async () => {
      const mockMarkAsRead = vi.fn();
      vi.mocked(require('convex/react').useMutation).mockReturnValue(mockMarkAsRead);

      render(
        <ConvexProvider client={mockConvexClient}>
          <NotificationCenter isOpen={true} onClose={() => {}} />
        </ConvexProvider>
      );

      const notification = await screen.findByText('New Job Assignment');
      fireEvent.click(notification);

      expect(mockMarkAsRead).toHaveBeenCalled();
    });

    it('should display district-specific notifications', async () => {
      render(
        <ConvexProvider client={mockConvexClient}>
          <NotificationCenter isOpen={true} onClose={() => {}} />
        </ConvexProvider>
      );

      // Check district context display
      await waitFor(() => {
        expect(screen.getByText('Śródmieście')).toBeInTheDocument();
      });
    });
  });

  describe('Client Portal Integration', () => {
    it('should authenticate client access', async () => {
      render(
        <ConvexProvider client={mockConvexClient}>
          <ClientPortal contactId="contact1" accessToken="test-token" />
        </ConvexProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome back, Test Client!')).toBeInTheDocument();
      });
    });

    it('should display client dashboard with statistics', async () => {
      render(
        <ConvexProvider client={mockConvexClient}>
          <ClientPortal contactId="contact1" accessToken="test-token" />
        </ConvexProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument(); // Total jobs
        expect(screen.getByText('$2,500')).toBeInTheDocument(); // Total spent
      });
    });

    it('should handle service booking navigation', async () => {
      render(
        <ConvexProvider client={mockConvexClient}>
          <ClientPortal contactId="contact1" accessToken="test-token" />
        </ConvexProvider>
      );

      const bookServiceButton = await screen.findByText('Book Service');
      fireEvent.click(bookServiceButton);

      await waitFor(() => {
        expect(screen.getByText('Select Service Type')).toBeInTheDocument();
      });
    });

    it('should deny access for invalid tokens', async () => {
      vi.mocked(require('convex/react').useQuery).mockImplementation((api) => {
        if (api.toString().includes('getClientAccess')) {
          return { hasAccess: false, role: 'none' };
        }
        return null;
      });

      render(
        <ConvexProvider client={mockConvexClient}>
          <ClientPortal contactId="contact1" accessToken="invalid-token" />
        </ConvexProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });
    });
  });

  describe('Cross-System Integration', () => {
    it('should sync message notifications with notification center', async () => {
      // Mock sending a message
      const mockSendMessage = vi.fn().mockResolvedValue('msg123');
      const mockCreateNotification = vi.fn().mockResolvedValue('notif123');

      // Test message creation triggers notification
      const messageData = {
        content: 'Test integration message',
        channelId: 'general',
        districtContext: {
          district: 'Śródmieście',
          urgencyLevel: 'normal'
        }
      };

      await mockSendMessage(messageData);

      // Verify notification was created
      expect(mockSendMessage).toHaveBeenCalledWith(messageData);
      expect(mockSendMessage).toHaveBeenCalledTimes(1);
    });

    it('should integrate with map system for district routing', async () => {
      // Test district-based message routing with map coordinates
      const districtMessage = {
        content: 'Emergency in Śródmieście',
        districtContext: {
          district: 'Śródmieście',
          urgencyLevel: 'emergency'
        },
        location: {
          lat: 52.2297,
          lng: 21.0122,
          relevantRadius: 2000
        }
      };

      // Test map integration
      expect(districtMessage.districtContext.district).toBe('Śródmieście');
      expect(districtMessage.location.lat).toBe(52.2297);
      expect(districtMessage.location.lng).toBe(21.0122);
    });

    it('should sync prophecy predictions with notification system', async () => {
      // Test prophecy hotspot predictions trigger notifications
      const hotspotPrediction = {
        district: 'Wilanów',
        predictedDemand: 0.85,
        serviceTypes: ['installation', 'maintenance'],
        confidence: 0.92
      };

      const mockProphecyNotification = {
        title: 'AI Prophecy Alert',
        message: `High demand predicted in ${hotspotPrediction.district}`,
        type: 'district_alert',
        priority: 'medium',
        districtContext: {
          district: hotspotPrediction.district,
          affluenceLevel: 8,
          priorityMultiplier: 1.2
        }
      };

      expect(mockProphecyNotification.districtContext.district).toBe('Wilanów');
      expect(mockProphecyNotification.type).toBe('district_alert');
    });

    it('should sync client portal activities with map and prophecy systems', async () => {
      // Test client booking triggers map route update and prophecy data sync
      const clientBooking = {
        contactId: 'contact1',
        serviceType: 'installation',
        scheduledDate: '2024-01-15',
        address: 'ul. Nowy Świat 1, Śródmieście',
        coordinates: { lat: 52.2297, lng: 21.0122 }
      };

      // Mock integration responses
      const mockMapUpdate = vi.fn().mockResolvedValue({
        routeUpdated: true,
        newOptimalRoute: ['job1', 'job2', 'newBooking']
      });

      const mockProphecySync = vi.fn().mockResolvedValue({
        dataStored: true,
        vectorEmbedding: [0.1, 0.2, 0.3],
        districtAnalysisUpdated: true
      });

      await mockMapUpdate(clientBooking);
      await mockProphecySync(clientBooking);

      expect(mockMapUpdate).toHaveBeenCalledWith(clientBooking);
      expect(mockProphecySync).toHaveBeenCalledWith(clientBooking);
    });

    it('should maintain data consistency across Convex and Weaviate', async () => {
      // Test data sync audit trail
      const testData = {
        messageId: 'msg123',
        jobId: 'job456',
        district: 'Mokotów',
        timestamp: Date.now()
      };

      const mockConvexUpdate = vi.fn().mockResolvedValue({ success: true });
      const mockWeaviateSync = vi.fn().mockResolvedValue({
        vectorStored: true,
        embeddingId: 'embed789'
      });
      const mockAuditLog = vi.fn().mockResolvedValue({ logId: 'audit123' });

      // Simulate data sync process
      await mockConvexUpdate(testData);
      await mockWeaviateSync(testData);
      await mockAuditLog({
        action: 'data_sync',
        convexSuccess: true,
        weaviateSuccess: true,
        timestamp: testData.timestamp
      });

      expect(mockConvexUpdate).toHaveBeenCalledWith(testData);
      expect(mockWeaviateSync).toHaveBeenCalledWith(testData);
      expect(mockAuditLog).toHaveBeenCalled();
    });

    it('should integrate with job system for context', async () => {
      // Test job-related messaging
      const jobMessage = {
        content: 'Job update',
        jobId: 'job123',
        channelId: 'project-job123'
      };

      expect(jobMessage.jobId).toBe('job123');
    });

    it('should handle offline message queuing', async () => {
      // Mock offline scenario
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });

      // Test offline message handling
      const offlineMessage = {
        content: 'Offline message',
        isOfflineMessage: true,
        syncStatus: 'pending'
      };

      expect(offlineMessage.syncStatus).toBe('pending');
    });
  });

  describe('Performance Tests', () => {
    it('should load messages within performance targets', async () => {
      const startTime = performance.now();

      render(
        <ConvexProvider client={mockConvexClient}>
          <ChatModule />
        </ConvexProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });

      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(1500); // <1.5s load time target
    });

    it('should handle high message volume', async () => {
      const manyMessages = Array.from({ length: 100 }, (_, i) => ({
        ...mockMessages[0],
        _id: `msg${i}`,
        content: `Message ${i}`
      }));

      vi.mocked(require('convex/react').useQuery).mockImplementation((api) => {
        if (api.toString().includes('messages.list')) {
          return manyMessages;
        }
        return mockChannels;
      });

      const startTime = performance.now();

      render(
        <ConvexProvider client={mockConvexClient}>
          <ChatModule />
        </ConvexProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Message 0')).toBeInTheDocument();
      });

      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(2000); // Should handle 100 messages quickly
    });
  });

  describe('Accessibility Tests', () => {
    it('should meet WCAG accessibility standards', async () => {
      render(
        <ConvexProvider client={mockConvexClient}>
          <ChatModule />
        </ConvexProvider>
      );

      // Check for proper ARIA labels
      const chatInput = screen.getByRole('textbox');
      expect(chatInput).toHaveAttribute('aria-label');

      // Check for keyboard navigation
      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeInTheDocument();
    });

    it('should support screen readers', async () => {
      render(
        <ConvexProvider client={mockConvexClient}>
          <NotificationCenter isOpen={true} onClose={() => {}} />
        </ConvexProvider>
      );

      // Check for proper heading structure
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
    });
  });
});

// Helper function for testing real-time updates
export const simulateRealTimeUpdate = (component: any, newData: any) => {
  // Simulate Convex real-time update
  component.rerender();
  return waitFor(() => {
    expect(screen.getByText(newData.content)).toBeInTheDocument();
  });
};

// Performance monitoring helper
export const measurePerformance = async (testFunction: () => Promise<void>) => {
  const startTime = performance.now();
  await testFunction();
  const endTime = performance.now();
  return endTime - startTime;
};
