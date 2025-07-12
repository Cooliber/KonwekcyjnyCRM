import { Clock, MapPin, Users } from "lucide-react";
import type React from "react";

interface DistrictNotificationsProps {
  district: string;
}

export const DistrictNotifications: React.FC<DistrictNotificationsProps> = ({ district }) => {
  // Mock data - would come from real queries
  const districtInfo = {
    affluence: 8,
    activeJobs: 3,
    avgResponseTime: 25,
    onlineTechnicians: 2,
    urgentJobs: 1,
  };

  const getAffluenceColor = (level: number) => {
    if (level >= 8) return "text-green-600 bg-green-100";
    if (level >= 6) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <div className="bg-blue-50 border-b border-blue-200 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 text-blue-600 mr-1" />
            <span className="font-medium text-blue-900">{district}</span>
            <span
              className={`ml-2 px-2 py-1 text-xs rounded-full ${getAffluenceColor(districtInfo.affluence)}`}
            >
              Affluence: {districtInfo.affluence}/10
            </span>
          </div>

          <div className="flex items-center text-sm text-blue-700">
            <Users className="w-4 h-4 mr-1" />
            {districtInfo.onlineTechnicians} online
          </div>

          <div className="flex items-center text-sm text-blue-700">
            <Clock className="w-4 h-4 mr-1" />
            {districtInfo.avgResponseTime}min avg
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {districtInfo.urgentJobs > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
              {districtInfo.urgentJobs} urgent
            </span>
          )}
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            {districtInfo.activeJobs} active jobs
          </span>
        </div>
      </div>
    </div>
  );
};

export default DistrictNotifications;
