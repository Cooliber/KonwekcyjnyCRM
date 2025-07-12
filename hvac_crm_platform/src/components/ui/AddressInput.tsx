import { useState, useEffect } from "react";
import { MapPin, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { 
  parseWarsawAddress, 
  validateWarsawAddress, 
  generateCoordinatesForAddress,
  WARSAW_DISTRICTS 
} from "../../lib/geocoding";

interface AddressInputProps {
  value: string;
  onChange: (value: string, metadata?: {
    district?: string;
    coordinates?: { lat: number; lng: number };
    isValid: boolean;
  }) => void;
  placeholder?: string;
  className?: string;
  showValidation?: boolean;
  showDistrictSuggestions?: boolean;
}

export function AddressInput({
  value,
  onChange,
  placeholder = "Enter Warsaw address (e.g., ul. Marszałkowska 1, Śródmieście)",
  className = "",
  showValidation = true,
  showDistrictSuggestions = true
}: AddressInputProps) {
  const [validation, setValidation] = useState<{
    isValid: boolean;
    errors: string[];
    suggestions?: string[];
  }>({ isValid: true, errors: [] });
  
  const [detectedDistrict, setDetectedDistrict] = useState<string | undefined>();
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>();

  useEffect(() => {
    if (!value.trim()) {
      setValidation({ isValid: true, errors: [] });
      setDetectedDistrict(undefined);
      setCoordinates(undefined);
      return;
    }

    // Validate address
    const validationResult = validateWarsawAddress(value);
    setValidation(validationResult);

    // Parse address components
    const components = parseWarsawAddress(value);
    setDetectedDistrict(components.district);

    // Generate coordinates
    const coords = generateCoordinatesForAddress(value);
    setCoordinates(coords);

    // Notify parent component
    onChange(value, {
      district: components.district,
      coordinates: coords,
      isValid: validationResult.isValid
    });
  }, [value, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const getValidationIcon = () => {
    if (!value.trim()) return null;
    
    if (validation.isValid) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
  };

  const getValidationColor = () => {
    if (!value.trim()) return "border-gray-300";
    return validation.isValid ? "border-green-500" : "border-red-500";
  };

  return (
    <div className="space-y-2">
      {/* Address Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`
            block w-full pl-10 pr-12 py-2 border rounded-lg 
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${getValidationColor()} ${className}
          `}
        />
        {showValidation && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {getValidationIcon()}
          </div>
        )}
      </div>

      {/* District Detection */}
      {detectedDistrict && (
        <div className="flex items-center space-x-2 text-sm">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-green-700">
            District detected: <strong>{detectedDistrict}</strong>
          </span>
          {coordinates && (
            <span className="text-gray-500">
              ({coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)})
            </span>
          )}
        </div>
      )}

      {/* Validation Messages */}
      {showValidation && value.trim() && (
        <div className="space-y-1">
          {validation.errors.map((error, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          ))}
          
          {validation.suggestions?.map((suggestion, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm text-blue-600">
              <Info className="w-4 h-4" />
              <span>{suggestion}</span>
            </div>
          ))}
        </div>
      )}

      {/* District Suggestions */}
      {showDistrictSuggestions && !detectedDistrict && value.trim() && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm font-medium text-gray-700 mb-2">Warsaw Districts:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1 text-xs">
            {WARSAW_DISTRICTS.slice(0, 9).map((district) => (
              <button
                key={district.name}
                onClick={() => onChange(`${value}, ${district.name}`)}
                className="text-left px-2 py-1 rounded hover:bg-blue-100 text-blue-600 hover:text-blue-800"
              >
                {district.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Simplified version for forms
export function SimpleAddressInput({
  value,
  onChange,
  placeholder,
  className
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <AddressInput
      value={value}
      onChange={(val) => onChange(val)}
      placeholder={placeholder}
      className={className}
      showValidation={false}
      showDistrictSuggestions={false}
    />
  );
}

// Enhanced version with full features
export function EnhancedAddressInput(props: AddressInputProps) {
  return (
    <AddressInput
      {...props}
      showValidation={true}
      showDistrictSuggestions={true}
    />
  );
}
