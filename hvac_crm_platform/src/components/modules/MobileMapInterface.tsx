import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { 
  MapPin, 
  Navigation, 
  Phone, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Menu,
  X,
  Locate,
  Layers,
  Route,
  Home
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Mobile-specific Leaflet configuration
const mobileMapOptions = {
  zoomControl: false, // We'll add custom zoom controls
  attributionControl: false,
  tap: true,
  touchZoom: true,
  doubleClickZoom: false, // Prevent accidental zooming
  scrollWheelZoom: false, // Disable on mobile to prevent page scroll issues
  dragging: true,
  maxZoom: 18,
  minZoom: 10
};

interface MobileMapInterfaceProps {
  technicianId?: string;
  currentRoute?: any[];
  onJobComplete?: (jobId: string) => void;
}

export function MobileMapInterface({ technicianId, currentRoute, onJobComplete }: MobileMapInterfaceProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [mapLayer, setMapLayer] = useState<"standard" | "satellite">("standard");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Get technician's assigned jobs for today
  const todaysJobs = useQuery(api.jobs.list, {
    assignedToMe: true,
    scheduledAfter: new Date().setHours(0, 0, 0, 0),
    scheduledBefore: new Date().setHours(23, 59, 59, 999)
  });

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Geolocation error:", error);
          // Fallback to Warsaw center
          setCurrentLocation({ lat: 52.2297, lng: 21.0122 });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000 // Cache for 1 minute
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Custom mobile-friendly markers
  const createMobileJobIcon = (job: any) => {
    const colors = {
      urgent: '#EF4444',
      high: '#F59E0B',
      medium: '#3B82F6',
      low: '#10B981'
    };
    
    const statusIcons = {
      scheduled: '📅',
      in_progress: '🔧',
      completed: '✅',
      cancelled: '❌'
    };

    return L.divIcon({
      html: `
        <div style="
          background-color: ${colors[job.priority as keyof typeof colors]};
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        ">
          ${statusIcons[job.status as keyof typeof statusIcons] || '📍'}
        </div>
      `,
      className: 'mobile-job-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
  };

  const createCurrentLocationIcon = () => {
    return L.divIcon({
      html: `
        <div style="
          background: linear-gradient(45deg, #3B82F6, #1D4ED8);
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
          animation: pulse 2s infinite;
        "></div>
        <style>
          @keyframes pulse {
            0% { box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3); }
            50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.1); }
            100% { box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3); }
          }
        </style>
      `,
      className: 'current-location-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  const handleJobSelect = (job: any) => {
    setSelectedJob(job);
    setIsMenuOpen(false);
  };

  const handleJobComplete = (jobId: string) => {
    if (onJobComplete) {
      onJobComplete(jobId);
    }
    setSelectedJob(null);
  };

  const getJobStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const mapCenter = currentLocation || { lat: 52.2297, lng: 21.0122 };

  return (
    <div className="h-screen flex flex-col bg-gray-100 relative">
      {/* Offline Indicator */}
      {isOffline && (
        <div className="bg-red-500 text-white text-center py-2 text-sm font-medium">
          📡 Offline Mode - Maps cached locally
        </div>
      )}

      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4 flex items-center justify-between">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        
        <div className="text-center">
          <h1 className="text-lg font-semibold text-gray-900">HVAC Mobile</h1>
          <p className="text-sm text-gray-600">
            {todaysJobs?.length || 0} jobs today
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMapLayer(mapLayer === "standard" ? "satellite" : "standard")}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Layers className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          {...mobileMapOptions}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={mapLayer === "satellite" 
              ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            }
          />

          {/* Current Location Marker */}
          {currentLocation && (
            <Marker
              position={[currentLocation.lat, currentLocation.lng]}
              icon={createCurrentLocationIcon()}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-medium">Your Location</p>
                  <p className="text-sm text-gray-600">
                    {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Job Markers */}
          {todaysJobs?.map((job) => (
            job.contact?.coordinates && (
              <Marker
                key={job._id}
                position={[job.contact.coordinates.lat, job.contact.coordinates.lng]}
                icon={createMobileJobIcon(job)}
                eventHandlers={{
                  click: () => handleJobSelect(job)
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-semibold mb-2">{job.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{job.contact?.address}</p>
                    <div className="space-y-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getJobStatusColor(job.status)}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{new Date(job.scheduledDate).toLocaleTimeString()}</span>
                      </div>
                      {job.contact?.phone && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <a href={`tel:${job.contact.phone}`} className="text-blue-600">
                            {job.contact.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>

        {/* Floating Action Buttons */}
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
          <button
            onClick={() => {
              if (currentLocation) {
                // Center map on current location
                window.location.reload(); // Simple way to recenter
              }
            }}
            className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
          >
            <Locate className="w-6 h-6" />
          </button>
          
          {selectedJob && (
            <button
              onClick={() => {
                // Open navigation to selected job
                const coords = selectedJob.contact?.coordinates;
                if (coords) {
                  window.open(`https://maps.google.com/maps?daddr=${coords.lat},${coords.lng}`, '_blank');
                }
              }}
              className="w-12 h-12 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-700 transition-colors"
            >
              <Navigation className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Slide-out Menu */}
      {isMenuOpen && (
        <div className="absolute inset-0 bg-black bg-opacity-50 z-50" onClick={() => setIsMenuOpen(false)}>
          <div 
            className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-xl transform transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Today's Jobs</h2>
              <p className="text-sm text-gray-600">{todaysJobs?.length || 0} scheduled</p>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {todaysJobs?.map((job) => (
                <div
                  key={job._id}
                  onClick={() => handleJobSelect(job)}
                  className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 text-sm">{job.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getJobStatusColor(job.status)}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{job.contact?.address}</p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(job.scheduledDate).toLocaleTimeString()}</span>
                    </div>
                    {job.contact?.phone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3 h-3" />
                        <span>{job.contact.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {(!todaysJobs || todaysJobs.length === 0) && (
                <div className="p-8 text-center text-gray-500">
                  <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No jobs scheduled for today</p>
                  <p className="text-sm">Enjoy your day off!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
