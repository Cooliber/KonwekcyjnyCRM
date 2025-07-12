import React from 'react';
import { 
  Calendar, 
  TrendingUp, 
  Wrench, 
  CheckCircle, 
  AlertTriangle,
  DollarSign,
  MapPin,
  Clock,
  Star,
  ArrowRight,
  Thermometer,
  Shield
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Type definitions for client dashboard data
interface ServiceHistory {
  id: string;
  date: string;
  type: string;
  status: 'completed' | 'scheduled' | 'cancelled';
  technician: string;
  cost: number;
  rating?: number;
  notes?: string;
}

interface UpcomingService {
  id: string;
  date: string;
  time: string;
  type: string;
  technician: string;
  estimatedDuration: number;
  status: 'confirmed' | 'pending' | 'rescheduled';
}

interface ClientDashboardData {
  clientName: string;
  totalServices: number;
  totalSpent: number;
  averageRating: number;
  nextService?: UpcomingService;
  recentServices: ServiceHistory[];
  systemHealth: {
    lastMaintenance: string;
    nextMaintenance: string;
    efficiency: number;
    alerts: string[];
  };
  preferences: {
    preferredTechnician?: string;
    communicationMethod: 'email' | 'sms' | 'phone';
    serviceReminders: boolean;
  };
}

interface ClientDashboardProps {
  data: ClientDashboardData;
  onBookService?: () => void;
  onViewHistory?: () => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  data,
  onBookService,
  onViewHistory
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'scheduled': return 'text-orange-600 bg-orange-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {data.contact.name}!
            </h1>
            <p className="text-blue-100 flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {data.contact.address} • {data.contact.district}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{data.statistics.activeInstallations}</div>
            <div className="text-blue-100">Active Systems</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{data.statistics.completedJobs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                ${data.statistics.totalSpent.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Job Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ${Math.round(data.statistics.avgJobValue).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Thermometer className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Systems</p>
              <p className="text-2xl font-bold text-gray-900">{data.installations.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Service Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Star className="w-5 h-5 text-yellow-500 mr-2" />
              Recommended Services
            </h2>
            <button
              onClick={onBookService}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Book Service →
            </button>
          </div>
          
          <div className="space-y-3">
            {data.recommendations.slice(0, 3).map((rec: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  {getPriorityIcon(rec.priority)}
                  <div className="ml-3">
                    <h3 className="font-medium text-gray-900">{rec.title}</h3>
                    <p className="text-sm text-gray-600">{rec.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">${rec.estimatedCost}</p>
                  <p className="text-sm text-gray-500">{rec.urgency}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Services</h2>
            <button
              onClick={onViewHistory}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          <div className="space-y-3">
            {data.recentJobs.slice(0, 4).map((job: any) => (
              <div key={job._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                <div className="flex items-center">
                  <Wrench className="w-4 h-4 text-gray-500 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">{job.title}</h3>
                    <p className="text-sm text-gray-600">
                      {formatDistanceToNow(new Date(job._creationTime), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(job.status)}`}>
                  {job.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
          
          {data.recentJobs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Wrench className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No recent services</p>
              <button
                onClick={onBookService}
                className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Book your first service
              </button>
            </div>
          )}
        </div>

        {/* Active Installations */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your HVAC Systems</h2>
          
          <div className="space-y-3">
            {data.installations.filter((inst: any) => inst.status === 'active').map((installation: any) => (
              <div key={installation._id} className="p-4 border border-gray-100 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">System #{installation._id.slice(-6)}</h3>
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    Active
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Installed:</p>
                    <p className="font-medium">
                      {new Date(installation.installationDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Warranty:</p>
                    <p className="font-medium">
                      {installation.warrantyExpiry 
                        ? new Date(installation.warrantyExpiry).toLocaleDateString()
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
                
                {installation.nextServiceDue && (
                  <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded">
                    <p className="text-sm text-orange-800">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Next service due: {new Date(installation.nextServiceDue).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {data.installations.filter((inst: any) => inst.status === 'active').length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No active installations</p>
            </div>
          )}
        </div>
      </div>

      {/* Active Quotes */}
      {data.activeQuotes && data.activeQuotes.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Quotes</h2>
          
          <div className="space-y-3">
            {data.activeQuotes.map((quote: any) => (
              <div key={quote._id} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{quote.title}</h3>
                  <p className="text-sm text-gray-600">{quote.description}</p>
                  <p className="text-sm text-yellow-800 mt-1">
                    Valid until: {new Date(quote.validUntil).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-gray-900">
                    ${quote.proposals[0]?.total.toLocaleString() || 'TBD'}
                  </p>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(quote.status)}`}>
                    {quote.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={onBookService}
            className="flex items-center justify-center p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Book Service
          </button>
          
          <button
            onClick={onViewHistory}
            className="flex items-center justify-center p-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Clock className="w-5 h-5 mr-2" />
            View History
          </button>
          
          <button className="flex items-center justify-center p-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Star className="w-5 h-5 mr-2" />
            Leave Feedback
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
