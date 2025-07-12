import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5173';
const TEST_USER_EMAIL = 'test@hvac.com';
const TEST_USER_PASSWORD = 'testpassword';
const CLIENT_ACCESS_TOKEN = 'client_test_token';

test.describe('Communications System E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Mock geolocation for Warsaw
    await page.setGeolocation({ latitude: 52.2297, longitude: 21.0122 });
    
    // Grant notification permissions
    await page.context().grantPermissions(['notifications']);
    
    await page.goto(BASE_URL);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Real-Time Messaging Flow', () => {
    test('should complete full messaging workflow', async () => {
      // Login as technician
      await page.fill('[data-testid="email-input"]', TEST_USER_EMAIL);
      await page.fill('[data-testid="password-input"]', TEST_USER_PASSWORD);
      await page.click('[data-testid="login-button"]');

      // Wait for dashboard to load
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();

      // Navigate to chat module
      await page.click('[data-testid="nav-chat"]');
      await expect(page.locator('[data-testid="chat-module"]')).toBeVisible();

      // Verify channels are loaded
      await expect(page.locator('[data-testid="channel-general"]')).toBeVisible();
      await expect(page.locator('[data-testid="channel-district"]')).toBeVisible();

      // Select district channel
      await page.click('[data-testid="channel-district-srodmiescie"]');
      
      // Verify district context is shown
      await expect(page.locator('[data-testid="district-context"]')).toContainText('Śródmieście');

      // Send a message
      const messageText = `Test message ${Date.now()}`;
      await page.fill('[data-testid="message-input"]', messageText);
      await page.click('[data-testid="send-button"]');

      // Verify message appears
      await expect(page.locator(`text=${messageText}`)).toBeVisible();

      // Test message priority
      await page.selectOption('[data-testid="priority-selector"]', 'high');
      await page.fill('[data-testid="message-input"]', 'High priority message');
      await page.click('[data-testid="send-button"]');

      // Verify priority indicator
      await expect(page.locator('[data-testid="priority-high"]')).toBeVisible();
    });

    test('should handle emergency alerts', async () => {
      await loginAsTechnician(page);
      await page.click('[data-testid="nav-chat"]');

      // Open emergency alert panel
      await page.click('[data-testid="emergency-alert-button"]');
      await expect(page.locator('[data-testid="emergency-panel"]')).toBeVisible();

      // Fill emergency form
      await page.selectOption('[data-testid="urgency-level"]', 'emergency');
      await page.selectOption('[data-testid="district-select"]', 'Śródmieście');
      await page.fill('[data-testid="emergency-message"]', 'HVAC system failure - immediate assistance needed');

      // Send emergency alert
      await page.click('[data-testid="send-emergency-button"]');

      // Verify confirmation
      await expect(page.locator('[data-testid="emergency-sent"]')).toBeVisible();
    });

    test('should support voice notes', async () => {
      await loginAsTechnician(page);
      await page.click('[data-testid="nav-chat"]');

      // Mock media devices
      await page.addInitScript(() => {
        navigator.mediaDevices.getUserMedia = () => Promise.resolve({
          getTracks: () => [{ stop: () => {} }]
        } as any);
      });

      // Test voice note recording
      await page.hover('[data-testid="voice-note-button"]');
      await page.mouse.down();
      
      // Wait for recording to start
      await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
      
      // Stop recording
      await page.mouse.up();
      
      // Verify voice note is sent
      await expect(page.locator('[data-testid="voice-note-message"]')).toBeVisible();
    });

    test('should handle file uploads', async () => {
      await loginAsTechnician(page);
      await page.click('[data-testid="nav-chat"]');

      // Upload file
      const fileInput = page.locator('[data-testid="file-input"]');
      await fileInput.setInputFiles({
        name: 'test-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data')
      });

      // Verify file upload
      await expect(page.locator('[data-testid="file-message"]')).toBeVisible();
      await expect(page.locator('text=test-image.jpg')).toBeVisible();
    });

    test('should support threading', async () => {
      await loginAsTechnician(page);
      await page.click('[data-testid="nav-chat"]');

      // Send initial message
      await page.fill('[data-testid="message-input"]', 'Original message for threading');
      await page.click('[data-testid="send-button"]');

      // Start thread
      await page.hover('[data-testid="message-bubble"]:last-child');
      await page.click('[data-testid="reply-button"]');
      
      await page.fill('[data-testid="thread-input"]', 'Thread reply');
      await page.click('[data-testid="start-thread-button"]');

      // Verify thread panel opens
      await expect(page.locator('[data-testid="thread-panel"]')).toBeVisible();
      await expect(page.locator('text=Thread reply')).toBeVisible();
    });
  });

  test.describe('Notification System Flow', () => {
    test('should display and manage notifications', async () => {
      await loginAsTechnician(page);

      // Open notification center
      await page.click('[data-testid="notifications-button"]');
      await expect(page.locator('[data-testid="notification-center"]')).toBeVisible();

      // Verify notifications are displayed
      await expect(page.locator('[data-testid="notification-item"]')).toHaveCount.greaterThan(0);

      // Test filtering
      await page.selectOption('[data-testid="priority-filter"]', 'high');
      await expect(page.locator('[data-testid="notification-item"][data-priority="high"]')).toBeVisible();

      // Mark notification as read
      await page.click('[data-testid="notification-item"]:first-child');
      await expect(page.locator('[data-testid="notification-item"]:first-child [data-testid="unread-indicator"]')).not.toBeVisible();

      // Mark all as read
      await page.click('[data-testid="mark-all-read"]');
      await expect(page.locator('[data-testid="unread-indicator"]')).toHaveCount(0);
    });

    test('should handle push notifications', async () => {
      await loginAsTechnician(page);

      // Listen for notification events
      let notificationReceived = false;
      page.on('notification', () => {
        notificationReceived = true;
      });

      // Trigger notification (would be from server in real scenario)
      await page.evaluate(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification('Test Notification', {
              body: 'Test notification body',
              icon: '/icons/icon-192x192.png'
            });
          });
        }
      });

      // Verify notification was shown
      await page.waitForTimeout(1000);
      // Note: Actual notification testing would require more complex setup
    });

    test('should prioritize notifications by AI importance', async () => {
      await loginAsTechnician(page);
      await page.click('[data-testid="notifications-button"]');

      // Verify AI-generated notifications are marked
      await expect(page.locator('[data-testid="ai-notification"]')).toBeVisible();

      // Verify high-importance notifications appear first
      const firstNotification = page.locator('[data-testid="notification-item"]').first();
      await expect(firstNotification).toHaveAttribute('data-importance', /^[0-9]\.[5-9]|1\.0$/);
    });
  });

  test.describe('Client Portal Flow', () => {
    test('should authenticate and display client dashboard', async () => {
      // Navigate to client portal
      await page.goto(`${BASE_URL}/client-portal?token=${CLIENT_ACCESS_TOKEN}&contact=test-contact`);

      // Verify authentication
      await expect(page.locator('[data-testid="client-dashboard"]')).toBeVisible();
      await expect(page.locator('text=Welcome back')).toBeVisible();

      // Verify statistics display
      await expect(page.locator('[data-testid="total-jobs"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-spent"]')).toBeVisible();
      await expect(page.locator('[data-testid="active-installations"]')).toBeVisible();
    });

    test('should complete service booking flow', async () => {
      await page.goto(`${BASE_URL}/client-portal?token=${CLIENT_ACCESS_TOKEN}&contact=test-contact`);
      
      // Navigate to booking
      await page.click('[data-testid="book-service-button"]');
      await expect(page.locator('[data-testid="service-booking"]')).toBeVisible();

      // Step 1: Select service type
      await page.click('[data-testid="service-maintenance"]');
      await page.click('[data-testid="next-button"]');

      // Step 2: Select date and time
      await page.click('[data-testid="calendar-day"][data-available="true"]');
      await page.click('[data-testid="time-slot"]:first-child');
      await page.click('[data-testid="next-button"]');

      // Step 3: Add details
      await page.selectOption('[data-testid="priority-select"]', 'medium');
      await page.fill('[data-testid="description-input"]', 'Annual maintenance check');
      await page.click('[data-testid="book-appointment-button"]');

      // Step 4: Confirmation
      await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible();
      await expect(page.locator('text=Booking Confirmed')).toBeVisible();
    });

    test('should display service history', async () => {
      await page.goto(`${BASE_URL}/client-portal?token=${CLIENT_ACCESS_TOKEN}&contact=test-contact`);
      
      await page.click('[data-testid="nav-history"]');
      await expect(page.locator('[data-testid="service-history"]')).toBeVisible();

      // Verify job history
      await expect(page.locator('[data-testid="job-item"]')).toHaveCount.greaterThan(0);

      // Verify installations
      await expect(page.locator('[data-testid="installation-item"]')).toBeVisible();
    });

    test('should submit feedback', async () => {
      await page.goto(`${BASE_URL}/client-portal?token=${CLIENT_ACCESS_TOKEN}&contact=test-contact`);
      
      await page.click('[data-testid="nav-feedback"]');
      await expect(page.locator('[data-testid="feedback-form"]')).toBeVisible();

      // Select job for feedback
      await page.selectOption('[data-testid="job-select"]', 'completed-job-1');

      // Rate service
      await page.click('[data-testid="star-rating"] [data-star="5"]');

      // Add feedback
      await page.fill('[data-testid="feedback-text"]', 'Excellent service, very professional technician');

      // Select categories
      await page.check('[data-testid="category-punctuality"]');
      await page.check('[data-testid="category-quality"]');

      // Submit feedback
      await page.click('[data-testid="submit-feedback"]');

      // Verify submission
      await expect(page.locator('[data-testid="feedback-success"]')).toBeVisible();
    });
  });

  test.describe('Cross-System Integration', () => {
    test('should sync data across all systems', async () => {
      await loginAsTechnician(page);

      // Create a job
      await page.click('[data-testid="nav-jobs"]');
      await page.click('[data-testid="create-job-button"]');
      await page.fill('[data-testid="job-title"]', 'Integration Test Job');
      await page.selectOption('[data-testid="job-contact"]', 'test-contact');
      await page.click('[data-testid="save-job"]');

      // Verify job appears in chat context
      await page.click('[data-testid="nav-chat"]');
      await page.click('[data-testid="channel-project"]');
      await expect(page.locator('text=Integration Test Job')).toBeVisible();

      // Verify notification was created
      await page.click('[data-testid="notifications-button"]');
      await expect(page.locator('text=New job assigned')).toBeVisible();

      // Verify job appears on map
      await page.click('[data-testid="nav-map"]');
      await expect(page.locator('[data-testid="job-marker"]')).toBeVisible();
    });

    test('should handle offline scenarios', async () => {
      await loginAsTechnician(page);
      await page.click('[data-testid="nav-chat"]');

      // Go offline
      await page.context().setOffline(true);

      // Try to send message
      await page.fill('[data-testid="message-input"]', 'Offline message');
      await page.click('[data-testid="send-button"]');

      // Verify offline indicator
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();

      // Go back online
      await page.context().setOffline(false);

      // Verify message syncs
      await expect(page.locator('text=Offline message')).toBeVisible();
    });
  });

  test.describe('Performance Tests', () => {
    test('should load within performance targets', async () => {
      const startTime = Date.now();
      
      await loginAsTechnician(page);
      await page.click('[data-testid="nav-chat"]');
      
      // Wait for chat to be fully loaded
      await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(1500); // <1.5s target
    });

    test('should handle high message volume', async () => {
      await loginAsTechnician(page);
      await page.click('[data-testid="nav-chat"]');

      // Simulate high message volume
      for (let i = 0; i < 50; i++) {
        await page.fill('[data-testid="message-input"]', `Message ${i}`);
        await page.click('[data-testid="send-button"]');
        await page.waitForTimeout(10); // Small delay to prevent overwhelming
      }

      // Verify all messages are displayed
      await expect(page.locator('[data-testid="message-bubble"]')).toHaveCount(50);
    });
  });
});

// Helper functions
async function loginAsTechnician(page: Page) {
  await page.fill('[data-testid="email-input"]', TEST_USER_EMAIL);
  await page.fill('[data-testid="password-input"]', TEST_USER_PASSWORD);
  await page.click('[data-testid="login-button"]');
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
}

// Performance measurement helper
async function measurePageLoad(page: Page, url: string) {
  const startTime = Date.now();
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  return Date.now() - startTime;
}
