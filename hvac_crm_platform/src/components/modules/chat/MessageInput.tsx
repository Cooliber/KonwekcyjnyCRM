import { useMutation } from "convex/react";
import { AtSign, Clock, MapPin, Mic, MicOff, Paperclip, Send, Smile } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../../../convex/_generated/api";

interface MessageInputProps {
  onSendMessage: (
    content: string,
    options?: {
      priority?: "low" | "normal" | "high" | "urgent";
      mentions?: string[];
      location?: { lat: number; lng: number; address?: string };
      scheduledFor?: number;
    }
  ) => void;
  placeholder?: string;
  allowVoiceNotes?: boolean;
  allowFileUpload?: boolean;
  showDistrictContext?: boolean;
  district?: string | null;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  placeholder = "Type a message...",
  allowVoiceNotes = true,
  allowFileUpload = true,
  showDistrictContext = false,
  district,
}) => {
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<Date | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);
  const [mentions, setMentions] = useState<string[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mutations
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
  const sendFile = useMutation(api.messages.sendFile);
  const sendImage = useMutation(api.messages.sendImage);
  const sendVoiceNote = useMutation(api.messages.sendVoiceNote);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  // Get current location
  useEffect(() => {
    if (showDistrictContext && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.log("Location access denied:", error)
      );
    }
  }, [showDistrictContext]);

  const handleSend = () => {
    if (!message.trim()) return;

    const options: any = {
      priority,
      mentions: mentions.length > 0 ? mentions : undefined,
      location: currentLocation,
      scheduledFor: scheduledFor?.getTime(),
    };

    onSendMessage(message, options);
    setMessage("");
    setPriority("normal");
    setScheduledFor(null);
    setMentions([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        await uploadVoiceNote(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const uploadVoiceNote = async (blob: Blob) => {
    try {
      const uploadUrl = await generateUploadUrl();

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: blob,
      });

      if (response.ok) {
        const { storageId } = await response.json();
        await sendVoiceNote({
          fileId: storageId,
          duration: recordingTime,
          transcription: `Voice note (${recordingTime}s)`,
        });
      }
    } catch (error) {
      console.error("Failed to upload voice note:", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadUrl = await generateUploadUrl();

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: file,
      });

      if (response.ok) {
        const { storageId } = await response.json();

        if (file.type.startsWith("image/")) {
          await sendImage({
            fileId: storageId,
            fileName: file.name,
          });
        } else {
          await sendFile({
            fileId: storageId,
            fileName: file.name,
          });
        }
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getPriorityColor = () => {
    switch (priority) {
      case "urgent":
        return "text-red-600 bg-red-50 border-red-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "normal":
        return "text-gray-600 bg-gray-50 border-gray-200";
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-3">
      {/* Priority and Options Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Priority Selector */}
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className={`text-xs px-2 py-1 border rounded ${getPriorityColor()}`}
          >
            <option value="low">Low Priority</option>
            <option value="normal">Normal</option>
            <option value="high">High Priority</option>
            <option value="urgent">🚨 Urgent</option>
          </select>

          {/* District Context */}
          {showDistrictContext && district && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              {district}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Schedule Message */}
          <button
            onClick={() => setShowScheduler(!showScheduler)}
            className="p-1 text-gray-500 hover:text-gray-700 rounded"
            title="Schedule Message"
          >
            <Clock className="w-4 h-4" />
          </button>

          {/* Location Toggle */}
          {showDistrictContext && (
            <button
              onClick={() => setCurrentLocation(currentLocation ? null : { lat: 0, lng: 0 })}
              className={`p-1 rounded ${currentLocation ? "text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
              title="Include Location"
            >
              <MapPin className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scheduler */}
      {showScheduler && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Schedule for later:
          </label>
          <input
            type="datetime-local"
            value={scheduledFor ? scheduledFor.toISOString().slice(0, 16) : ""}
            onChange={(e) => setScheduledFor(e.target.value ? new Date(e.target.value) : null)}
            className="w-full p-2 border border-gray-300 rounded text-sm"
          />
        </div>
      )}

      {/* Main Input Area */}
      <div className="flex items-end space-x-2">
        {/* File Upload */}
        {allowFileUpload && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Attach File"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            style={{ maxHeight: "120px" }}
          />

          {/* Mentions and Emojis */}
          <div className="absolute bottom-2 right-2 flex items-center space-x-1">
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <AtSign className="w-4 h-4" />
            </button>
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <Smile className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Voice Recording */}
        {allowVoiceNotes && (
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            className={`p-2 rounded-lg transition-colors ${
              isRecording
                ? "bg-red-600 text-white"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
            title={isRecording ? "Release to send" : "Hold to record"}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        )}

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Send Message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="flex items-center justify-center space-x-2 text-red-600">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
          <span className="text-sm font-medium">
            Recording: {formatRecordingTime(recordingTime)}
          </span>
        </div>
      )}

      {/* Scheduled Message Indicator */}
      {scheduledFor && (
        <div className="text-xs text-gray-600 flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          Scheduled for: {scheduledFor.toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default MessageInput;
