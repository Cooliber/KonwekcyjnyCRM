import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MapContainer, TileLayer, Marker, Popup, Polygon, Polyline, useMap } from "react-leaflet";
import { MapPin, Filter, Wrench, Clock, CheckCircle, AlertTriangle, DollarSign, TrendingUp, Users, Calendar } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RoutePlanningPanel } from "./RoutePlanningPanel";
import { ProphecyHotspotsPanel } from "./ProphecyHotspotsPanel";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export function MapModule() {
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [mapView, setMapView] = useState<"installations" | "affluence" | "routes" | "prophecy">("installations");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [optimizedRoutes, setOptimizedRoutes] = useState<any[]>([]);
  const [hotspots, setHotspots] = useState<any[]>([]);

  // Get installations for mapping
  const installations = useQuery(api.installations?.list, {
    district: filterDistrict || undefined,
    status: filterStatus || undefined,
  });

  const contacts = useQuery(api.contacts.list, {});

  // Warsaw districts with affluence data (from ProphecyDashboard)
  const warsawDistrictsData = [
    {
      name: "Śródmieście",
      affluence: 0.9,
      avgQuote: 12500,
      jobs: 15,
      trend: "+12%",
      coordinates: [
        [52.2297, 21.0122], [52.2400, 21.0122], [52.2400, 21.0300], [52.2297, 21.0300]
      ]
    },
    {
      name: "Wilanów",
      affluence: 0.85,
      avgQuote: 11800,
      jobs: 8,
      trend: "+8%",
      coordinates: [
        [52.1650, 21.0900], [52.1750, 21.0900], [52.1750, 21.1100], [52.1650, 21.1100]
      ]
    },
    {
      name: "Mokotów",
      affluence: 0.75,
      avgQuote: 9500,
      jobs: 12,
      trend: "+5%",
      coordinates: [
        [52.1800, 21.0000], [52.2000, 21.0000], [52.2000, 21.0400], [52.1800, 21.0400]
      ]
    },
    {
      name: "Żoliborz",
      affluence: 0.7,
      avgQuote: 8800,
      jobs: 10,
      trend: "+3%",
      coordinates: [
        [52.2600, 20.9800], [52.2800, 20.9800], [52.2800, 21.0200], [52.2600, 21.0200]
      ]
    },
    {
      name: "Ursynów",
      affluence: 0.65,
      avgQuote: 8200,
      jobs: 14,
      trend: "+7%",
      coordinates: [
        [52.1400, 21.0400], [52.1600, 21.0400], [52.1600, 21.0800], [52.1400, 21.0800]
      ]
    },
    {
      name: "Wola",
      affluence: 0.6,
      avgQuote: 7500,
      jobs: 11,
      trend: "-2%",
      coordinates: [
        [52.2200, 20.9600], [52.2400, 20.9600], [52.2400, 21.0000], [52.2200, 21.0000]
      ]
    },
    {
      name: "Praga-Południe",
      affluence: 0.45,
      avgQuote: 6200,
      jobs: 9,
      trend: "+1%",
      coordinates: [
        [52.2200, 21.0400], [52.2400, 21.0400], [52.2400, 21.0800], [52.2200, 21.0800]
      ]
    },
    {
      name: "Targówek",
      affluence: 0.4,
      avgQuote: 5800,
      jobs: 7,
      trend: "-1%",
      coordinates: [
        [52.2800, 21.0400], [52.3000, 21.0400], [52.3000, 21.0800], [52.2800, 21.0800]
      ]
    },
  ];

  // Get color based on affluence score
  const getDistrictColor = (affluence: number) => {
    if (affluence >= 0.8) return "#10B981"; // Green for high affluence
    if (affluence >= 0.6) return "#F59E0B"; // Yellow for medium affluence
    return "#EF4444"; // Red for low affluence
  };

  // Get opacity based on affluence score
  const getDistrictOpacity = (affluence: number) => {
    return 0.3 + (affluence * 0.4); // 0.3 to 0.7 opacity range
  };

  const statusColors = {
    active: "bg-green-100 text-green-800",
    needs_service: "bg-yellow-100 text-yellow-800",
    warranty_expired: "bg-orange-100 text-orange-800",
    removed: "bg-gray-100 text-gray-800",
  };

  const statusIcons: Record<string, any> = {
    active: CheckCircle,
    needs_service: Clock,
    warranty_expired: AlertTriangle,
    removed: Wrench,
  };

  // Create custom icons for different installation statuses
  const createCustomIcon = (status: string) => {
    const colors = {
      active: '#10B981',
      needs_service: '#F59E0B',
      warranty_expired: '#EF4444',
      removed: '#6B7280'
    };

    return L.divIcon({
      html: `<div style="background-color: ${colors[status as keyof typeof colors]}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      className: 'custom-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interactive Warsaw HVAC Map</h1>
          <p className="text-gray-600">AI-powered district analysis with route optimization</p>
        </div>

        {/* Map View Toggle */}
        <div className="flex space-x-2">
          <button
            onClick={() => setMapView("installations")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mapView === "installations"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Installations
          </button>
          <button
            onClick={() => setMapView("affluence")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mapView === "affluence"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Affluence Map
          </button>
          <button
            onClick={() => setMapView("routes")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mapView === "routes"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Route Planning
          </button>
          <button
            onClick={() => setMapView("prophecy")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mapView === "prophecy"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            🔮 Prophecy
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4">
          <select
            value={filterDistrict}
            onChange={(e) => setFilterDistrict(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Districts</option>
            {warsawDistrictsData.map((district) => (
              <option key={district.name} value={district.name}>
                {district.name} (Affluence: {(district.affluence * 100).toFixed(0)}%)
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="needs_service">Needs Service</option>
            <option value="warranty_expired">Warranty Expired</option>
            <option value="removed">Removed</option>
          </select>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="h-96 relative">
          <MapContainer
            center={[52.2297, 21.0122]} // Warsaw center
            zoom={11}
            style={{ height: "100%", width: "100%" }}
            className="rounded-lg"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* District Polygons for Affluence View */}
            {mapView === "affluence" && warsawDistrictsData.map((district) => (
              <Polygon
                key={district.name}
                positions={district.coordinates as any}
                pathOptions={{
                  fillColor: getDistrictColor(district.affluence),
                  fillOpacity: getDistrictOpacity(district.affluence),
                  color: getDistrictColor(district.affluence),
                  weight: 2,
                }}
                eventHandlers={{
                  click: () => setSelectedDistrict(district.name),
                  mouseover: (e) => {
                    e.target.setStyle({ weight: 4 });
                  },
                  mouseout: (e) => {
                    e.target.setStyle({ weight: 2 });
                  },
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold text-lg">{district.name}</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span>Affluence: {(district.affluence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span>Avg Quote: {district.avgQuote.toLocaleString()} PLN</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span>Jobs: {district.jobs} ({district.trend})</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Polygon>
            ))}

            {/* Installation Markers */}
            {(mapView === "installations" || mapView === "routes") && installations?.map((installation) => (
              installation.coordinates && (
                <Marker
                  key={installation._id}
                  position={[installation.coordinates.lat, installation.coordinates.lng]}
                  icon={createCustomIcon(installation.status)}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-semibold">{installation.address}</h3>
                      <p className="text-sm text-gray-600">{installation.district}</p>
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[installation.status]}`}>
                          {installation.status.replace('_', ' ')}
                        </span>
                      </div>
                      {installation.lastServiceDate && (
                        <p className="text-xs text-gray-500 mt-1">
                          Last service: {new Date(installation.lastServiceDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )
            ))}

            {/* Optimized Route Lines */}
            {mapView === "routes" && optimizedRoutes.map((route, routeIndex) => {
              const routeColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
              const color = routeColors[routeIndex % routeColors.length];

              if (route.points.length < 2) return null;

              const routeCoordinates = route.points.map((point: any) => [point.lat, point.lng]);

              return (
                <Polyline
                  key={`route-${routeIndex}`}
                  positions={routeCoordinates}
                  pathOptions={{
                    color,
                    weight: 4,
                    opacity: 0.8,
                    dashArray: routeIndex === 0 ? undefined : '10, 10' // First route solid, others dashed
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-semibold">Route {routeIndex + 1}</h3>
                      <div className="space-y-1 text-sm">
                        <p>Jobs: {route.points.length}</p>
                        <p>Distance: {route.totalDistance}km</p>
                        <p>Duration: {Math.round(route.totalDuration/60)}h {route.totalDuration%60}m</p>
                        <p>Efficiency: {Math.round(route.efficiency * 100)}%</p>
                        <p>Cost: {route.estimatedCost} PLN</p>
                      </div>
                    </div>
                  </Popup>
                </Polyline>
              );
            })}

            {/* Route Job Markers */}
            {mapView === "routes" && optimizedRoutes.flatMap((route, routeIndex) =>
              route.points.map((point: any, pointIndex: number) => {
                const routeColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
                const color = routeColors[routeIndex % routeColors.length];

                const routeIcon = L.divIcon({
                  html: `<div style="background-color: ${color}; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${pointIndex + 1}</div>`,
                  className: 'custom-route-marker',
                  iconSize: [24, 24],
                  iconAnchor: [12, 12]
                });

                return (
                  <Marker
                    key={`route-${routeIndex}-point-${pointIndex}`}
                    position={[point.lat, point.lng]}
                    icon={routeIcon}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold">Stop {pointIndex + 1}</h3>
                        <p className="text-sm text-gray-600">{point.address}</p>
                        <p className="text-sm text-gray-600">{point.district}</p>
                        <div className="mt-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            point.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            point.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            point.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {point.priority} • {point.jobType}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Est. duration: {point.estimatedDuration} min
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })
            )}

            {/* Prophecy Hotspot Markers */}
            {mapView === "prophecy" && hotspots.map((hotspot, index) => {
              const getDemandColor = (demand: number) => {
                if (demand >= 0.8) return '#EF4444'; // Red for very high
                if (demand >= 0.6) return '#F59E0B'; // Orange for high
                if (demand >= 0.4) return '#EAB308'; // Yellow for medium
                return '#10B981'; // Green for low
              };

              const hotspotIcon = L.divIcon({
                html: `
                  <div style="
                    background: linear-gradient(45deg, ${getDemandColor(hotspot.predictedDemand)}, ${getDemandColor(hotspot.predictedDemand)}aa);
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: pulse 2s infinite;
                  ">
                    <div style="
                      color: white;
                      font-size: 16px;
                      font-weight: bold;
                      text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                    ">🔮</div>
                  </div>
                  <style>
                    @keyframes pulse {
                      0% { transform: scale(1); opacity: 1; }
                      50% { transform: scale(1.1); opacity: 0.8; }
                      100% { transform: scale(1); opacity: 1; }
                    }
                  </style>
                `,
                className: 'prophecy-hotspot-marker',
                iconSize: [40, 40],
                iconAnchor: [20, 20]
              });

              return (
                <Marker
                  key={`hotspot-${index}`}
                  position={[hotspot.coordinates.lat, hotspot.coordinates.lng]}
                  icon={hotspotIcon}
                >
                  <Popup>
                    <div className="p-3 min-w-[250px]">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">🔮</span>
                        <h3 className="font-semibold text-lg">{hotspot.district} Hotspot</h3>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Predicted Demand:</span>
                          <span className="font-medium" style={{ color: getDemandColor(hotspot.predictedDemand) }}>
                            {Math.round(hotspot.predictedDemand * 100)}%
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-600">Confidence:</span>
                          <span className="font-medium text-green-600">
                            {Math.round(hotspot.confidence * 100)}%
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-600">Seasonal Factor:</span>
                          <span className="font-medium">
                            {Math.round(hotspot.seasonalFactor * 100)}%
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-600">Affluence:</span>
                          <span className="font-medium">
                            {Math.round(hotspot.affluenceFactor * 100)}%
                          </span>
                        </div>

                        <div className="mt-3 pt-2 border-t border-gray-200">
                          <p className="text-gray-600 text-xs mb-1">Top Services:</p>
                          <div className="flex flex-wrap gap-1">
                            {hotspot.serviceTypes.slice(0, 3).map((service: string, idx: number) => (
                              <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                {service}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-gray-200">
                          <p className="text-gray-600 text-xs mb-1">AI Reasoning:</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {hotspot.reasoning.slice(0, 2).map((reason: string, idx: number) => (
                              <li key={idx} className="flex items-start space-x-1">
                                <span className="text-purple-400 mt-0.5">•</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* District Insights Panel */}
      {selectedDistrict && mapView === "affluence" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {selectedDistrict} District Insights
            </h3>
            <button
              onClick={() => setSelectedDistrict(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {(() => {
            const district = warsawDistrictsData.find(d => d.name === selectedDistrict);
            if (!district) return null;

            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <DollarSign className="w-8 h-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600">Affluence Score</p>
                      <p className="text-2xl font-semibold text-green-900">
                        {(district.affluence * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600">Average Quote</p>
                      <p className="text-2xl font-semibold text-blue-900">
                        {district.avgQuote.toLocaleString()} PLN
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-600">Active Jobs</p>
                      <p className="text-2xl font-semibold text-purple-900">
                        {district.jobs} <span className="text-sm">({district.trend})</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Route Planning Panel */}
      {mapView === "routes" && (
        <div className="space-y-4">
          {/* Date Selector */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-4">
              <Calendar className="w-5 h-5 text-blue-600" />
              <label className="text-sm font-medium text-gray-700">
                Planning Date:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <RoutePlanningPanel
            selectedDate={selectedDate}
            onRouteOptimized={(routes) => setOptimizedRoutes(routes)}
          />
        </div>
      )}

      {/* Prophecy Hotspots Panel */}
      {mapView === "prophecy" && (
        <ProphecyHotspotsPanel
          selectedDistrict={selectedDistrict}
          onHotspotsGenerated={(predictions) => setHotspots(predictions)}
        />
      )}

      {/* Installation List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Installation List</h3>
        </div>
        
        {installations && installations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Location</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">District</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Installation Date</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Next Service</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {installations.map((installation) => {
                  const StatusIcon = statusIcons[installation.status];
                  
                  return (
                    <tr key={installation._id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{installation.address}</p>
                            <p className="text-sm text-gray-500">
                              {installation.coordinates && 
                                `${installation.coordinates.lat.toFixed(4)}, ${installation.coordinates.lng.toFixed(4)}`
                              }
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-900">{installation.district}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <StatusIcon className="w-4 h-4 text-gray-400" />
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[installation.status as keyof typeof statusColors]}`}>
                            {installation.status.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-900">
                          {new Date(installation.installationDate).toLocaleDateString('pl-PL')}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-900">
                          {installation.nextServiceDue 
                            ? new Date(installation.nextServiceDue).toLocaleDateString('pl-PL')
                            : "Not scheduled"
                          }
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No installations found</p>
            <p className="text-sm text-gray-400 mt-1">
              Installations will appear here once jobs are completed
            </p>
          </div>
        )}
      </div>

      {/* District Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Installations</p>
              <p className="text-2xl font-semibold text-gray-900">
                {installations?.filter(i => i.status === 'active').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Need Service</p>
              <p className="text-2xl font-semibold text-gray-900">
                {installations?.filter(i => i.status === 'needs_service').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-100">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Warranty Expired</p>
              <p className="text-2xl font-semibold text-gray-900">
                {installations?.filter(i => i.status === 'warranty_expired').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Districts</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Set(installations?.map(i => i.district)).size || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
