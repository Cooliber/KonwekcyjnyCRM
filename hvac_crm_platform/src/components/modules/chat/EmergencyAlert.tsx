import React, { useState } from 'react';
import { AlertTriangle, X, MapPin, Clock } from 'lucide-react';

interface EmergencyAlertProps {
  districts: string[];
  onSendUrgent: (content: string, district: string) => void;
  onClose: () => void;
}

export const EmergencyAlert: React.FC<EmergencyAlertProps> = ({
  districts,
  onSendUrgent,
  onClose
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [message, setMessage] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState<'high' | 'emergency'>('high');

  const handleSend = () => {
    if (message.trim() && selectedDistrict) {
      onSendUrgent(message.trim(), selectedDistrict);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-red-50">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-red-900">Emergency Alert</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Urgency Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Urgency Level
            </label>
            <select
              value={urgencyLevel}
              onChange={(e) => setUrgencyLevel(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            >
              <option value="high">🟡 High Priority</option>
              <option value="emergency">🔴 Emergency</option>
            </select>
          </div>

          {/* District Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Warsaw District
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select district...</option>
              {districts.map(district => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emergency Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the emergency situation..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
              rows={4}
            />
          </div>

          {/* Warning */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Warning:</p>
                <p>This will immediately notify all technicians and managers in the selected district.</p>
              </div>
            </div>
          </div>

          {/* Estimated Response */}
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-1" />
            Estimated response time: 15 minutes
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!message.trim() || !selectedDistrict}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Send Emergency Alert
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyAlert;
