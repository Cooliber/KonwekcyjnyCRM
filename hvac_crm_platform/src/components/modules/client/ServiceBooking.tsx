import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, ArrowRight, CheckCircle, Clock } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";

interface ServiceBookingProps {
  contactId: string;
  accessToken?: string;
  district: string;
  onBookingComplete?: () => void;
}

export const ServiceBooking: React.FC<ServiceBookingProps> = ({
  contactId,
  accessToken,
  district,
  onBookingComplete,
}) => {
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [step, setStep] = useState(1); // 1: Service Type, 2: Date/Time, 3: Details, 4: Confirmation

  // Get available slots when service and date are selected
  const availableSlots = useQuery(
    api.clientPortal.getAvailableSlots,
    selectedService && selectedDate
      ? {
          contactId,
          serviceType: selectedService as any,
          preferredDate: selectedDate.getTime(),
          district,
        }
      : "skip"
  );

  // Book appointment mutation
  const bookAppointment = useMutation(api.clientPortal.bookAppointment);

  const serviceTypes = [
    {
      id: "maintenance",
      name: "Maintenance",
      description: "Regular system maintenance and cleaning",
      duration: "2 hours",
      icon: "🔧",
    },
    {
      id: "repair",
      name: "Repair",
      description: "Fix issues with your HVAC system",
      duration: "3 hours",
      icon: "⚡",
    },
    {
      id: "installation",
      name: "Installation",
      description: "Install new HVAC equipment",
      duration: "6 hours",
      icon: "🏗️",
    },
    {
      id: "inspection",
      name: "Inspection",
      description: "System inspection and diagnostics",
      duration: "1 hour",
      icon: "🔍",
    },
  ];

  const handleBooking = async () => {
    if (!(selectedSlot && selectedService && description.trim())) return;

    try {
      const _result = await bookAppointment({
        contactId,
        serviceType: selectedService as any,
        scheduledDate: selectedSlot.datetime,
        description: description.trim(),
        priority,
        accessToken,
      });

      setStep(4); // Show confirmation
    } catch (error) {
      console.error("Booking failed:", error);
      alert("Failed to book appointment. Please try again.");
    }
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const _lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const isCurrentMonth = date.getMonth() === month;
      const isPast = date < today;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isSelected =
        selectedDate &&
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear();

      days.push({
        date,
        isCurrentMonth,
        isPast,
        isWeekend,
        isSelected,
        isAvailable: isCurrentMonth && !isPast && !isWeekend,
      });
    }

    return days;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Service Type</h2>
              <p className="text-gray-600">Choose the type of service you need</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceTypes.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service.id)}
                  className={`
                    p-6 border-2 rounded-lg text-left transition-all
                    ${
                      selectedService === service.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }
                  `}
                >
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-3">{service.icon}</span>
                    <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                  </div>
                  <p className="text-gray-600 mb-2">{service.description}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    {service.duration}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!selectedService}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Date & Time</h2>
              <p className="text-gray-600">Choose your preferred appointment slot</p>
            </div>

            {/* Calendar */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                    )
                  }
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-semibold">
                  {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </h3>
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
                    )
                  }
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((day, index) => (
                  <button
                    key={index}
                    onClick={() => (day.isAvailable ? setSelectedDate(day.date) : null)}
                    disabled={!day.isAvailable}
                    className={`
                      p-2 text-sm rounded transition-colors
                      ${!day.isCurrentMonth ? "text-gray-300" : ""}
                      ${day.isPast || day.isWeekend ? "text-gray-400 cursor-not-allowed" : ""}
                      ${day.isAvailable ? "hover:bg-blue-100 cursor-pointer" : ""}
                      ${day.isSelected ? "bg-blue-600 text-white" : ""}
                    `}
                  >
                    {day.date.getDate()}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            {selectedDate && availableSlots && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Available Times</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {availableSlots.map((slot: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedSlot(slot)}
                      className={`
                        p-3 border rounded-lg text-center transition-colors
                        ${
                          selectedSlot?.datetime === slot.datetime
                            ? "border-blue-500 bg-blue-50 text-blue-900"
                            : "border-gray-200 hover:border-gray-300"
                        }
                      `}
                    >
                      <div className="font-medium">{formatTime(slot.datetime)}</div>
                      <div className="text-xs text-gray-500">
                        {slot.availableTechnicians} techs available
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedSlot}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Details</h2>
              <p className="text-gray-600">
                Provide additional information about your service request
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low - Routine maintenance</option>
                  <option value="medium">Medium - Standard service</option>
                  <option value="high">High - Urgent issue</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe the issue or service needed..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </button>
              <button
                onClick={handleBooking}
                disabled={!description.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Book Appointment
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
              <p className="text-gray-600">
                Your service appointment has been successfully scheduled
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 text-left max-w-md mx-auto">
              <h3 className="font-semibold text-gray-900 mb-4">Appointment Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Service:</span>
                  <span className="font-medium">
                    {serviceTypes.find((s) => s.id === selectedService)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{selectedDate?.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">
                    {selectedSlot && formatTime(selectedSlot.datetime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Priority:</span>
                  <span className="font-medium capitalize">{priority}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onBookingComplete}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Return to Dashboard
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div
                className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step >= stepNumber ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"}
              `}
              >
                {stepNumber}
              </div>
              {stepNumber < 4 && (
                <div
                  className={`
                  w-16 h-1 mx-2
                  ${step > stepNumber ? "bg-blue-600" : "bg-gray-200"}
                `}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>Service</span>
          <span>Date & Time</span>
          <span>Details</span>
          <span>Confirmation</span>
        </div>
      </div>

      {renderStepContent()}
    </div>
  );
};

export default ServiceBooking;
