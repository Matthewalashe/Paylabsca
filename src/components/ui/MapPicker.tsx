// ============================================================
// MapPicker.tsx — Interactive Leaflet map for coordinate picking
// ============================================================
// Free OpenStreetMap tiles, no API key needed.
// User clicks to place marker, displays coordinates.
// ============================================================

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Check, X, RotateCcw, Crosshair } from "lucide-react";

// Fix default marker icon (Leaflet CSS bundling issue)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapPickerProps {
  latitude: number;
  longitude: number;
  onSelect: (lat: number, lng: number) => void;
  onClose: () => void;
}

/** Component that listens for map clicks */
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Component to recenter the map */
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

// Lagos center as default
const LAGOS_CENTER = { lat: 6.5244, lng: 3.3792 };

export default function MapPicker({ latitude, longitude, onSelect, onClose }: MapPickerProps) {
  const hasValidCoords = latitude !== 0 && longitude !== 0;
  const initialLat = hasValidCoords ? latitude : LAGOS_CENTER.lat;
  const initialLng = hasValidCoords ? longitude : LAGOS_CENTER.lng;

  const [pickedLat, setPickedLat] = useState(initialLat);
  const [pickedLng, setPickedLng] = useState(initialLng);
  const [hasChanged, setHasChanged] = useState(false);

  const handleMapClick = (lat: number, lng: number) => {
    setPickedLat(parseFloat(lat.toFixed(6)));
    setPickedLng(parseFloat(lng.toFixed(6)));
    setHasChanged(true);
  };

  const handleReset = () => {
    setPickedLat(initialLat);
    setPickedLng(initialLng);
    setHasChanged(false);
  };

  const handleConfirm = () => {
    onSelect(pickedLat, pickedLng);
    onClose();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#006400]" />
          <span className="text-sm font-bold text-gray-900">Pick Location on Map</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Map */}
      <div className="h-[280px] sm:h-[350px] w-full relative">
        <MapContainer
          center={[initialLat, initialLng]}
          zoom={hasValidCoords ? 16 : 12}
          className="h-full w-full z-0"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[pickedLat, pickedLng]} />
          <MapClickHandler onMapClick={handleMapClick} />
          {hasChanged && <MapRecenter lat={pickedLat} lng={pickedLng} />}
        </MapContainer>

        {/* Instruction overlay */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <div className="bg-black/70 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Crosshair className="w-3 h-3" /> Tap / click to set location
          </div>
        </div>
      </div>

      {/* Coordinates display + actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Coords readout */}
          <div className="text-xs space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-8">Lat:</span>
              <span className="font-mono font-bold text-gray-900">{pickedLat.toFixed(6)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-8">Lng:</span>
              <span className="font-mono font-bold text-gray-900">{pickedLng.toFixed(6)}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {hasChanged && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
            <button
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#006400] rounded-lg hover:bg-[#005000] transition-colors shadow-sm"
            >
              <Check className="w-3.5 h-3.5" /> Use These Coordinates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
