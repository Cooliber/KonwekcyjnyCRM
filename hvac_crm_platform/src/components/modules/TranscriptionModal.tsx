import { useAction, useMutation } from "convex/react";
import { Brain, DollarSign, FileText, MapPin, Mic, Phone, User, Wrench, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";

interface TranscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactCreated?: (contactId: string) => void;
}

export function TranscriptionModal({ isOpen, onClose, onContactCreated }: TranscriptionModalProps) {
  const [transcriptionText, setTranscriptionText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [affluenceAnalysis, setAffluenceAnalysis] = useState<any>(null);
  const [aiQuote, setAiQuote] = useState<any>(null);

  const createTranscription = useMutation(api.transcriptions.create);
  const _processTranscription = useMutation(api.transcriptions.processWithAI);
  const updateFromTranscription = useMutation(api.contacts.updateFromTranscription);
  const analyzeAffluence = useAction(api.ai.analyzeAffluence);
  const generateQuote = useAction(api.ai.generateQuote);

  const handleProcessTranscription = async () => {
    if (!transcriptionText.trim()) {
      toast.error("Please enter transcription text");
      return;
    }

    setIsProcessing(true);
    try {
      // Create transcription record
      const _transcriptionId = await createTranscription({
        originalText: transcriptionText,
        extractedData: {}, // Will be filled by AI processing
        confidence: 0.8, // Default confidence
        processed: false,
      });

      // Extract basic data from text
      const mockExtractedData = extractDataFromText(transcriptionText);
      setExtractedData(mockExtractedData);

      // Run AI affluence analysis
      try {
        const customerData = {
          name: mockExtractedData.customerName,
          address: mockExtractedData.address,
          district: extractDistrict(mockExtractedData.address),
          transcriptionText: transcriptionText,
          equipmentRequested: mockExtractedData.deviceCount
            ? `${mockExtractedData.deviceCount} units`
            : undefined,
        };

        const affluenceResult = await analyzeAffluence({ customerData });
        setAffluenceAnalysis(affluenceResult);

        // Generate AI-powered quote
        if (customerData.name) {
          const quoteData = {
            ...customerData,
            roomCount: mockExtractedData.roomCount,
            budget: mockExtractedData.budget,
          };
          const quoteResult = await generateQuote({
            customerData: quoteData,
            affluenceAnalysis: affluenceResult,
          });
          setAiQuote(quoteResult);
        }
      } catch (error) {
        console.error("AI analysis failed:", error);
        // Continue with basic extraction even if AI fails
      }

      toast.success("Transcription processed with AI insights");
    } catch (_error) {
      toast.error("Failed to process transcription");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateContact = async () => {
    if (!extractedData) return;

    try {
      const contactId = await updateFromTranscription({
        transcriptionId: "temp" as any, // In real implementation, use actual transcription ID
      });

      if (contactId && onContactCreated) {
        onContactCreated(contactId);
      }

      toast.success("Contact created from transcription");
      onClose();
    } catch (_error) {
      toast.error("Failed to create contact");
    }
  };

  // Simple text extraction logic (in real implementation, this would be AI-powered)
  const extractDataFromText = (text: string) => {
    const lowerText = text.toLowerCase();

    // Extract name (look for "my name is" or "I'm" patterns)
    const nameMatch = text.match(/(?:my name is|i'm|i am)\s+([a-zA-Z\s]+)/i);
    const customerName = nameMatch ? nameMatch[1].trim() : "";

    // Extract phone (look for phone number patterns)
    const phoneMatch = text.match(/(\+?48\s?)?(\d{3}[\s-]?\d{3}[\s-]?\d{3})/);
    const phone = phoneMatch ? phoneMatch[0] : "";

    // Extract address (look for address keywords)
    const addressMatch = text.match(/(?:address|live at|located at)\s+([^.]+)/i);
    const address = addressMatch ? addressMatch[1].trim() : "";

    // Extract device information
    const deviceMatch = text.match(/(\d+)\s*(?:units?|devices?|air\s*condition)/i);
    const deviceCount = deviceMatch ? Number.parseInt(deviceMatch[1]) : undefined;

    // Extract room count
    const roomMatch = text.match(/(\d+)\s*rooms?/i);
    const roomCount = roomMatch ? Number.parseInt(roomMatch[1]) : undefined;

    // Extract budget
    const budgetMatch = text.match(/(\d+(?:,\d{3})*)\s*(?:pln|zloty|złoty)/i);
    const budget = budgetMatch ? Number.parseInt(budgetMatch[1].replace(/,/g, "")) : undefined;

    // Extract urgency
    const urgency =
      lowerText.includes("urgent") || lowerText.includes("emergency")
        ? "urgent"
        : lowerText.includes("soon") || lowerText.includes("quickly")
          ? "high"
          : "normal";

    return {
      customerName,
      phone,
      address,
      deviceCount,
      roomCount,
      budget,
      urgency,
      additionalNotes: text,
    };
  };

  // Extract Warsaw district from address
  const extractDistrict = (address: string) => {
    if (!address) return undefined;
    const districts = [
      "Śródmieście",
      "Wilanów",
      "Mokotów",
      "Żoliborz",
      "Ursynów",
      "Wola",
      "Bemowo",
      "Bielany",
      "Ochota",
      "Praga-Południe",
      "Praga-Północ",
      "Targówek",
      "Białołęka",
      "Rembertów",
      "Wawer",
      "Wesoła",
      "Włochy",
    ];

    for (const district of districts) {
      if (address.toLowerCase().includes(district.toLowerCase())) {
        return district;
      }
    }
    return undefined;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Mic className="w-5 h-5 mr-2" />
            AI Transcription Processing
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Transcription Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transcription Text
            </label>
            <textarea
              value={transcriptionText}
              onChange={(e) => setTranscriptionText(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Paste or type the call transcription here..."
            />
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleProcessTranscription}
              disabled={isProcessing || !transcriptionText.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>{isProcessing ? "Processing..." : "Process with AI"}</span>
            </button>
          </div>

          {/* Extracted Data Display */}
          {extractedData && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Extracted Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Customer Name</p>
                      <p className="text-gray-900">
                        {extractedData.customerName || "Not detected"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Phone Number</p>
                      <p className="text-gray-900">{extractedData.phone || "Not detected"}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Address</p>
                      <p className="text-gray-900">{extractedData.address || "Not detected"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Wrench className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Equipment Details</p>
                      <p className="text-gray-900">
                        {extractedData.deviceCount
                          ? `${extractedData.deviceCount} units`
                          : "Not specified"}
                        {extractedData.roomCount && ` • ${extractedData.roomCount} rooms`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 text-gray-400 flex items-center justify-center">💰</div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Budget</p>
                      <p className="text-gray-900">
                        {extractedData.budget
                          ? `${extractedData.budget.toLocaleString()} PLN`
                          : "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 text-gray-400 flex items-center justify-center">⚡</div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Urgency</p>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          extractedData.urgency === "urgent"
                            ? "bg-red-100 text-red-800"
                            : extractedData.urgency === "high"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {extractedData.urgency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Insights Section */}
              {affluenceAnalysis && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-purple-600" />
                    AI Affluence Analysis
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Affluence Score</span>
                        <span className="text-lg font-bold text-purple-600">
                          {Math.round(affluenceAnalysis.score * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${affluenceAnalysis.score * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Price Multiplier</span>
                        <span className="text-lg font-bold text-green-600">
                          {affluenceAnalysis.priceMultiplier.toFixed(2)}x
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {affluenceAnalysis.priceMultiplier > 1
                          ? "Premium pricing recommended"
                          : "Standard pricing"}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-700">Analysis Factors:</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {affluenceAnalysis.factors.map((factor: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* AI Quote Section */}
              {aiQuote && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                    AI-Generated Quote
                  </h4>

                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Base Price:</span>
                      <span className="font-medium">{aiQuote.basePrice.toLocaleString()} PLN</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">AI Adjusted Price:</span>
                      <span className="text-lg font-bold text-green-600">
                        {aiQuote.adjustedPrice.toLocaleString()} PLN
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">{aiQuote.reasoning}</div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Quote Breakdown:</span>
                    {aiQuote.lineItems.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"
                      >
                        <div>
                          <span className="text-sm text-gray-900">{item.description}</span>
                          <span className="text-xs text-gray-500 ml-2">({item.type})</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium">
                            {item.quantity}x {item.unitPrice.toLocaleString()} PLN
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateContact}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Contact {aiQuote && `(${aiQuote.adjustedPrice.toLocaleString()} PLN)`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
