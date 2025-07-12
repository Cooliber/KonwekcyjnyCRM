import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MobileMapInterface } from "../components/modules/MobileMapInterface";
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Download, 
  CheckCircle,
  AlertTriangle,
  Settings
} from "lucide-react";

export function MobilePage() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPromptShown, setInstallPromptShown] = useState(false);

  // Get current user profile to check if they're a technician
  const userProfile = useQuery(api.users.getCurrentProfile);

  // PWA installation handling
  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    // Online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }, []);

  // Show install prompt after a delay if not installed
  useEffect(() => {
    if (!isInstalled && !installPromptShown && deferredPrompt) {
      const timer = setTimeout(() => {
        setInstallPromptShown(true);
      }, 5000); // Show after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [isInstalled, installPromptShown, deferredPrompt]);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setInstallPromptShown(false);
    }
  };

  // Check if user is a technician
  const isTechnician = userProfile?.role === 'technician';

  if (!isTechnician) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <Smartphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">HVAC Mobile</h1>
          <p className="text-gray-600 mb-6">
            This mobile interface is designed for technicians. Please log in with a technician account to access mobile features.
          </p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Settings className="w-4 h-4 mr-2" />
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Connection Status Bar */}
      <div className={`w-full py-2 px-4 text-center text-sm font-medium ${
        isOnline 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white'
      }`}>
        <div className="flex items-center justify-center space-x-2">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span>Offline Mode</span>
            </>
          )}
        </div>
      </div>

      {/* Install App Prompt */}
      {!isInstalled && installPromptShown && deferredPrompt && (
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Download className="w-5 h-5" />
              <div>
                <p className="font-medium">Install HVAC Mobile</p>
                <p className="text-sm text-blue-100">Get faster access and offline features</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setInstallPromptShown(false)}
                className="px-3 py-1 text-sm bg-blue-500 rounded hover:bg-blue-400 transition-colors"
              >
                Later
              </button>
              <button
                onClick={handleInstallApp}
                className="px-3 py-1 text-sm bg-white text-blue-600 rounded hover:bg-gray-100 transition-colors"
              >
                Install
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Status Indicators */}
      {isInstalled && (
        <div className="bg-green-50 border-b border-green-200 p-3">
          <div className="flex items-center justify-center space-x-2 text-green-800">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">App installed - Offline features available</span>
          </div>
        </div>
      )}

      {/* Main Mobile Interface */}
      <MobileMapInterface
        technicianId={userProfile?.userId}
        onJobComplete={(jobId) => {
          console.log('Job completed:', jobId);
          // Handle job completion
        }}
      />

      {/* PWA Features Info (shown only when not installed) */}
      {!isInstalled && (
        <div className="fixed bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">Enhanced Mobile Experience</h3>
              <p className="text-sm text-gray-600 mb-3">
                Install this app for offline maps, push notifications, and faster loading.
              </p>
              <div className="flex items-center space-x-2">
                {deferredPrompt ? (
                  <button
                    onClick={handleInstallApp}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Install Now
                  </button>
                ) : (
                  <p className="text-xs text-gray-500">
                    Use "Add to Home Screen" in your browser menu
                  </p>
                )}
                <button
                  onClick={() => setInstallPromptShown(false)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MobilePage;
