import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { MapModule } from './MapModule';
import { ProphecyDashboard } from './ProphecyDashboard';
import { ChatModule } from './ChatModule';
import { NotificationCenter } from './NotificationCenter';
import { 
  MessageSquare, 
  Map, 
  Brain, 
  Bell, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface IntegratedDashboardProps {
  defaultView?: 'map' | 'prophecy' | 'communications' | 'overview';
}

export const IntegratedDashboard: React.FC<IntegratedDashboardProps> = ({
  defaultView = 'overview'
}) => {
  const [activeView, setActiveView] = useState(defaultView);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [integrationStatus, setIntegrationStatus] = useState<any>(null);

  // Get audit report for integration status
  const auditReport = useQuery(api.auditService.getAuditReport, {
    timeRange: "1h"
  });

  // Get data consistency report
  const consistencyReport = useQuery(api.auditService.getDataConsistencyReport, {});

  // Sync communication data mutation
  const syncCommunicationData = useMutation(api.integrationService.syncCommunicationData);

  // Update integration status when audit report changes
  useEffect(() => {
    if (auditReport) {
      setIntegrationStatus({
        overallHealth: auditReport.summary.successRate >= 95 ? 'healthy' : 
                      auditReport.summary.successRate >= 80 ? 'warning' : 'error',
        successRate: auditReport.summary.successRate,
        lastUpdate: auditReport.generatedAt,
        dataSyncHealth: auditReport.dataSyncHealth
      });
    }
  }, [auditReport]);

  const handleDistrictSelect = (district: string) => {
    setSelectedDistrict(district);
    // Trigger cross-system sync for district-specific data
    toast.info(`Loading integrated data for ${district}...`);
  };

  const handleEmergencyMessage = async (messageId: string) => {
    try {
      // Sync emergency message across all systems
      await syncCommunicationData({
        messageId: messageId as any,
        includeMapUpdate: true,
        includeProphecySync: true,
        auditLevel: "detailed"
      });
      
      toast.success('Emergency alert synchronized across all systems');
    } catch (error) {
      toast.error('Failed to sync emergency alert');
    }
  };

  const renderIntegrationStatus = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">System Integration Status</h3>
        </div>
        <div className="flex items-center space-x-2">
          {integrationStatus?.overallHealth === 'healthy' && (
            <CheckCircle className="w-5 h-5 text-green-500" />
          )}
          {integrationStatus?.overallHealth === 'warning' && (
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          )}
          {integrationStatus?.overallHealth === 'error' && (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          )}
          <span className={`text-sm font-medium ${
            integrationStatus?.overallHealth === 'healthy' ? 'text-green-600' :
            integrationStatus?.overallHealth === 'warning' ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {integrationStatus?.successRate?.toFixed(1)}% Success Rate
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <div className="text-center">
          <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
            integrationStatus?.dataSyncHealth?.convexToWeaviate?.status === 'healthy' ? 'bg-green-500' :
            integrationStatus?.dataSyncHealth?.convexToWeaviate?.status === 'warning' ? 'bg-yellow-500' :
            'bg-red-500'
          }`}></div>
          <p className="text-xs text-gray-600">Prophecy Sync</p>
        </div>
        <div className="text-center">
          <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
            integrationStatus?.dataSyncHealth?.communicationsToMap?.status === 'healthy' ? 'bg-green-500' :
            integrationStatus?.dataSyncHealth?.communicationsToMap?.status === 'warning' ? 'bg-yellow-500' :
            'bg-red-500'
          }`}></div>
          <p className="text-xs text-gray-600">Map Sync</p>
        </div>
        <div className="text-center">
          <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
            integrationStatus?.dataSyncHealth?.clientPortalToSystems?.status === 'healthy' ? 'bg-green-500' :
            integrationStatus?.dataSyncHealth?.clientPortalToSystems?.status === 'warning' ? 'bg-yellow-500' :
            'bg-red-500'
          }`}></div>
          <p className="text-xs text-gray-600">Portal Sync</p>
        </div>
        <div className="text-center">
          <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
            integrationStatus?.dataSyncHealth?.notificationDelivery?.status === 'healthy' ? 'bg-green-500' :
            integrationStatus?.dataSyncHealth?.notificationDelivery?.status === 'warning' ? 'bg-yellow-500' :
            'bg-red-500'
          }`}></div>
          <p className="text-xs text-gray-600">Notifications</p>
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {renderIntegrationStatus()}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Communications Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
              Communications Hub
            </h3>
            <button
              onClick={() => setActiveView('communications')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View Full →
            </button>
          </div>
          <div className="h-64">
            <ChatModule initialChannelId="general" />
          </div>
        </div>

        {/* Map Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Map className="w-5 h-5 mr-2 text-green-600" />
              District Map
            </h3>
            <button
              onClick={() => setActiveView('map')}
              className="text-green-600 hover:text-green-700 text-sm font-medium"
            >
              View Full →
            </button>
          </div>
          <div className="h-64">
            <MapModule />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prophecy Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Brain className="w-5 h-5 mr-2 text-purple-600" />
              AI Prophecy
            </h3>
            <button
              onClick={() => setActiveView('prophecy')}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              View Full →
            </button>
          </div>
          <div className="h-64 overflow-hidden">
            <ProphecyDashboard />
          </div>
        </div>

        {/* Data Consistency Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-orange-600" />
              Data Consistency
            </h3>
            <Settings className="w-5 h-5 text-gray-400" />
          </div>
          
          {consistencyReport && (
            <div className="space-y-3">
              {consistencyReport.consistencyChecks.map((check, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{check.entity}</p>
                    <p className="text-sm text-gray-600">
                      {check.totalEntities} entities, {Math.round(check.consistencyRatio * 100)}% synced
                    </p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    check.consistencyRatio >= 0.9 ? 'bg-green-500' :
                    check.consistencyRatio >= 0.7 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'map':
        return <MapModule />;
      case 'prophecy':
        return <ProphecyDashboard />;
      case 'communications':
        return <ChatModule />;
      case 'overview':
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Integrated HVAC Dashboard</h1>
              <p className="text-gray-600">Communications • Map • Prophecy • Unified</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* District Selector */}
              <select
                value={selectedDistrict}
                onChange={(e) => handleDistrictSelect(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Districts</option>
                <option value="Śródmieście">Śródmieście</option>
                <option value="Mokotów">Mokotów</option>
                <option value="Wilanów">Wilanów</option>
                <option value="Żoliborz">Żoliborz</option>
              </select>

              {/* Notification Bell */}
              <button
                onClick={() => setIsNotificationCenterOpen(true)}
                className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
              >
                <Bell className="w-6 h-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'communications', label: 'Communications', icon: MessageSquare },
              { id: 'map', label: 'Map', icon: Map },
              { id: 'prophecy', label: 'Prophecy', icon: Brain }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveView(id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeView === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />
    </div>
  );
};
