import { useAction, useQuery } from "convex/react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Navigation,
  Play,
  RefreshCw,
  Route,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";

// Type definitions for route planning
interface RoutePoint {
  id: string;
  lat: number;
  lng: number;
  address: string;
  estimatedDuration: number;
  priority: "low" | "medium" | "high" | "urgent";
  jobType: string;
}

interface OptimizedRoute {
  id: string;
  technicianId: string;
  technicianName: string;
  points: RoutePoint[];
  totalDistance: number;
  totalDuration: number;
  estimatedCost: number;
  efficiency: number;
}

interface RoutePlanningPanelProps {
  selectedDate: string;
  onRouteOptimized: (routes: OptimizedRoute[]) => void;
}

export function RoutePlanningPanel({ selectedDate, onRouteOptimized }: RoutePlanningPanelProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);
  const [maxJobsPerTech, setMaxJobsPerTech] = useState(8);
  const [prioritizeUrgent, setPrioritizeUrgent] = useState(true);

  // Get available technicians
  const technicians = useQuery(api.users.getTechnicians, { isActive: true });

  // Get scheduled jobs for the selected date
  const scheduledJobs = useQuery(api.jobs.getScheduledForDate, { date: selectedDate });

  // Get existing optimized routes for the date
  const existingRoutes = useQuery(api.routes.getRoutesForDate, { date: selectedDate });

  // Route optimization action
  const optimizeRoutes = useAction(api.routes.optimizeRoutes);

  const handleOptimizeRoutes = async () => {
    if (!scheduledJobs || scheduledJobs.length === 0) {
      toast.error("No scheduled jobs found for this date");
      return;
    }

    if (selectedTechnicians.length === 0) {
      toast.error("Please select at least one technician");
      return;
    }

    setIsOptimizing(true);
    try {
      const result = await optimizeRoutes({
        date: selectedDate,
        technicianIds: selectedTechnicians as any,
        maxJobsPerTechnician: maxJobsPerTech,
        prioritizeUrgent,
      });

      toast.success(`Routes optimized! ${result.routes.length} routes created`);
      onRouteOptimized(result.routes);
    } catch (error) {
      console.error("Route optimization failed:", error);
      toast.error("Failed to optimize routes");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleTechnicianToggle = (techId: string) => {
    setSelectedTechnicians((prev) =>
      prev.includes(techId) ? prev.filter((id) => id !== techId) : [...prev, techId]
    );
  };

  const getJobsByPriority = () => {
    if (!scheduledJobs) return { urgent: 0, high: 0, medium: 0, low: 0 };

    return scheduledJobs.reduce(
      (acc, job) => {
        acc[job.priority] = (acc[job.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  };

  const jobsByPriority = getJobsByPriority();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Route className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Route Planning</h3>
            <p className="text-sm text-gray-600">Optimize technician routes for {selectedDate}</p>
          </div>
        </div>

        <button
          onClick={handleOptimizeRoutes}
          disabled={isOptimizing || !scheduledJobs || scheduledJobs.length === 0}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
            ${
              isOptimizing || !scheduledJobs || scheduledJobs.length === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }
          `}
        >
          {isOptimizing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Optimizing...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Optimize Routes</span>
            </>
          )}
        </button>
      </div>

      {/* Job Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-600">Urgent</span>
          </div>
          <p className="text-xl font-semibold text-red-900">{jobsByPriority.urgent || 0}</p>
        </div>

        <div className="bg-orange-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-600">High</span>
          </div>
          <p className="text-xl font-semibold text-orange-900">{jobsByPriority.high || 0}</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Medium</span>
          </div>
          <p className="text-xl font-semibold text-blue-900">{jobsByPriority.medium || 0}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-600">Low</span>
          </div>
          <p className="text-xl font-semibold text-gray-900">{jobsByPriority.low || 0}</p>
        </div>
      </div>

      {/* Optimization Settings */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Technicians</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {technicians?.map((tech) => (
              <label
                key={tech._id}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedTechnicians.includes(tech._id)}
                  onChange={() => handleTechnicianToggle(tech._id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{tech.name}</p>
                  <p className="text-xs text-gray-500">
                    {tech.serviceAreas.join(", ")} • {tech.vehicleType}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Jobs per Technician
            </label>
            <input
              type="number"
              min="1"
              max="15"
              value={maxJobsPerTech}
              onChange={(e) => setMaxJobsPerTech(Number.parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="prioritizeUrgent"
              checked={prioritizeUrgent}
              onChange={(e) => setPrioritizeUrgent(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="prioritizeUrgent" className="text-sm font-medium text-gray-700">
              Prioritize urgent jobs
            </label>
          </div>
        </div>
      </div>

      {/* Existing Routes Summary */}
      {existingRoutes && existingRoutes.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Existing Routes for {selectedDate}
          </h4>
          <div className="space-y-2">
            {existingRoutes.map((route, index) => (
              <div
                key={route._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Navigation className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Route {index + 1} • {route.points.length} jobs
                    </p>
                    <p className="text-xs text-gray-500">
                      {route.totalDistance}km • {Math.round(route.totalDuration / 60)}h{" "}
                      {route.totalDuration % 60}m
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-green-600 font-medium">
                    {Math.round(route.efficiency * 100)}% efficient
                  </span>
                  <span className="text-gray-600">{route.estimatedCost} PLN</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
