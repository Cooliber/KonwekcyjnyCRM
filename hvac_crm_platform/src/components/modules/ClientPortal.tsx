import { useQuery } from "convex/react";
import { Calendar, History, Home, LogOut, MessageSquare, Shield, Star } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { ClientDashboard } from "./client/ClientDashboard";
import { FeedbackForm } from "./client/FeedbackForm";
import { ServiceBooking } from "./client/ServiceBooking";
import { ServiceHistory } from "./client/ServiceHistory";

interface ClientPortalProps {
  contactId?: string;
  accessToken?: string;
  onLogout?: () => void;
}

export const ClientPortal: React.FC<ClientPortalProps> = ({ contactId, accessToken, onLogout }) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verify access
  const accessCheck = useQuery(
    api.clientPortal.getClientAccess,
    contactId ? { contactId, accessToken } : "skip"
  );

  // Get dashboard data
  const dashboardData = useQuery(
    api.clientPortal.getClientDashboard,
    isAuthenticated && contactId ? { contactId, accessToken } : "skip"
  );

  useEffect(() => {
    if (accessCheck?.hasAccess) {
      setIsAuthenticated(true);
    } else if (accessCheck?.hasAccess === false) {
      setIsAuthenticated(false);
    }
  }, [accessCheck]);

  // Show access denied if not authenticated
  if (accessCheck && !accessCheck.hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this client portal.
          </p>
          <button
            onClick={onLogout}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (!(isAuthenticated && dashboardData)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your portal...</p>
        </div>
      </div>
    );
  }

  const navigation = [
    { id: "dashboard", name: "Dashboard", icon: Home },
    { id: "booking", name: "Book Service", icon: Calendar },
    { id: "history", name: "Service History", icon: History },
    { id: "messages", name: "Messages", icon: MessageSquare },
    { id: "feedback", name: "Feedback", icon: Star },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <ClientDashboard
            data={dashboardData}
            onBookService={() => setActiveTab("booking")}
            onViewHistory={() => setActiveTab("history")}
          />
        );
      case "booking":
        return (
          <ServiceBooking
            contactId={contactId!}
            accessToken={accessToken}
            district={dashboardData.contact.district}
            onBookingComplete={() => setActiveTab("dashboard")}
          />
        );
      case "history":
        return (
          <ServiceHistory
            jobs={dashboardData.recentJobs}
            installations={dashboardData.installations}
            quotes={dashboardData.activeQuotes}
          />
        );
      case "messages":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Messages</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                Message functionality will be available soon. For urgent matters, please call us
                directly.
              </p>
            </div>
          </div>
        );
      case "feedback":
        return (
          <FeedbackForm
            contactId={contactId!}
            accessToken={accessToken}
            recentJobs={dashboardData.recentJobs.filter((job) => job.status === "completed")}
          />
        );
      default:
        return <ClientDashboard data={dashboardData} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">HVAC Client Portal</h1>
              <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {dashboardData.contact.name}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{dashboardData.contact.district}</span>
              <button
                onClick={onLogout}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex">
          {/* Sidebar Navigation */}
          <nav className="w-64 bg-white rounded-lg shadow-sm p-6 mr-8">
            <div className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`
                      w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors
                      ${
                        activeTab === item.id
                          ? "bg-blue-100 text-blue-900 border border-blue-200"
                          : "text-gray-700 hover:bg-gray-100"
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </button>
                );
              })}
            </div>

            {/* Quick Stats */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Jobs:</span>
                  <span className="font-medium">{dashboardData.statistics.totalJobs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Systems:</span>
                  <span className="font-medium">
                    {dashboardData.statistics.activeInstallations}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Spent:</span>
                  <span className="font-medium">
                    ${dashboardData.statistics.totalSpent.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Next Service Due */}
            {dashboardData.nextServiceDue && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h3 className="text-sm font-medium text-orange-900 mb-2">Service Reminder</h3>
                <p className="text-sm text-orange-800">
                  Next service due: {new Date(dashboardData.nextServiceDue).toLocaleDateString()}
                </p>
                <button
                  onClick={() => setActiveTab("booking")}
                  className="mt-2 text-sm text-orange-600 hover:text-orange-800 font-medium"
                >
                  Schedule Now →
                </button>
              </div>
            )}
          </nav>

          {/* Main Content */}
          <div className="flex-1 bg-white rounded-lg shadow-sm">{renderContent()}</div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">© 2024 HVAC Services. All rights reserved.</p>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Emergency: +48 123 456 789</span>
              <span>•</span>
              <span>support@hvac.com</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ClientPortal;
