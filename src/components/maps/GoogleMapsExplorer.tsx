import React, { useState, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Search,
  Navigation,
  Compass,
  Layers,
  Plus,
  BookmarkPlus,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Phone,
  Clock,
  Building,
} from 'lucide-react';

interface GoogleMapsExplorerProps {
  onSaveAsMemory?: (title: string, content: string) => void;
  onAddTask?: (title: string, desc: string) => void;
}

interface MapLocation {
  id: string;
  title: string;
  category: 'production' | 'biotech' | 'workspace' | 'custom';
  description: string;
  lat: number;
  lng: number;
  address: string;
  rating?: number;
}

const DEFAULT_LOCATIONS: MapLocation[] = [
  {
    id: 'loc-1',
    title: 'Pinewood Film Studios',
    category: 'production',
    description: 'Premier world-class sound stages, high-speed motion capture facilities, and water tanks.',
    lat: 51.5478,
    lng: -0.5361,
    address: 'Pinewood Road, Iver Heath, UK',
    rating: 4.8,
  },
  {
    id: 'loc-2',
    title: 'Cambridge Bio-Innovation Hub',
    category: 'biotech',
    description: 'Cutting-edge wet labs, structural biology beamline access, and genomic research center.',
    lat: 52.1752,
    lng: 0.1313,
    address: 'Cambridge Biomedical Campus, Cambridge, UK',
    rating: 4.9,
  },
  {
    id: 'loc-3',
    title: 'San Francisco AI Engineering Lab',
    category: 'workspace',
    description: 'Autonomous agent design center, GPU clusters, and high-bandwidth development workspace.',
    lat: 37.7749,
    lng: -122.4194,
    address: 'Market St, San Francisco, CA, USA',
    rating: 4.7,
  },
  {
    id: 'loc-4',
    title: 'SoHo Creative Motion Loft',
    category: 'production',
    description: 'Virtual LED volume production wall, Dolby Atmos mixing suite, and color grading theater.',
    lat: 40.7233,
    lng: -73.9984,
    address: 'SoHo, New York, NY, USA',
    rating: 4.9,
  },
];

const MAPS_API_KEY =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
  'AIzaSyD6w5cSDfcGRN49XNJ6eAPM1qHfMv7a7M8';

export const GoogleMapsExplorer: React.FC<GoogleMapsExplorerProps> = ({
  onSaveAsMemory,
  onAddTask,
}) => {
  const [locations, setLocations] = useState<MapLocation[]>(DEFAULT_LOCATIONS);
  const [selectedLoc, setSelectedLoc] = useState<MapLocation | null>(DEFAULT_LOCATIONS[0]);
  const [center, setCenter] = useState({ lat: 51.5478, lng: -0.5361 });
  const [zoom, setZoom] = useState(13);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleSelectLocation = (loc: MapLocation) => {
    setSelectedLoc(loc);
    setCenter({ lat: loc.lat, lng: loc.lng });
    setZoom(14);
  };

  // Search locations or query Gemini Maps Grounding
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch('/api/maps/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();

      // Check if coordinate pattern in query
      const coordMatch = searchQuery.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          const newLoc: MapLocation = {
            id: `loc-custom-${Date.now()}`,
            title: `Custom Location Pin`,
            category: 'custom',
            description: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            lat,
            lng,
            address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          };
          setLocations((prev) => [newLoc, ...prev]);
          handleSelectLocation(newLoc);
          showNotice(`Custom pin placed at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          setIsSearching(false);
          return;
        }
      }

      // If we got simulated or real places from backend
      if (Array.isArray(data.places) && data.places.length > 0) {
        showNotice(`Found: ${data.places[0].name}`);
      } else {
        showNotice(`Location search processed for "${searchQuery}"`);
      }
    } catch (err) {
      console.error('Maps search error:', err);
      showNotice('Location search query completed.');
    } finally {
      setIsSearching(false);
    }
  };

  // Get current user device GPS location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      showNotice('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const userLoc: MapLocation = {
          id: `loc-user-${Date.now()}`,
          title: 'My Current Location',
          category: 'workspace',
          description: `Device GPS location accurate to ${Math.round(pos.coords.accuracy)} meters.`,
          lat,
          lng,
          address: `GPS Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
        };
        setLocations((prev) => [userLoc, ...prev]);
        handleSelectLocation(userLoc);
        showNotice('Centered on your current device location.');
      },
      (err) => {
        showNotice(`Location access denied or unavailable: ${err.message}`);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-3.5 pb-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Google Maps Location Intelligence
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                    Live GMP SDK
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pin venues, production filming stages, science labs, and navigate locations for DAYMATE projects.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGetCurrentLocation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              title="Locate device GPS position"
            >
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              <span>My Location</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mt-3.5 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search studio stages, coordinates (e.g. 51.5, -0.5), or city..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 transition"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Explore'}
          </button>
        </form>

        {notice && (
          <div className="mt-2.5 p-2 rounded-lg bg-cyan-950/70 border border-cyan-800/80 text-[11px] text-cyan-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{notice}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Interactive Map + Location Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Interactive Google Map */}
        <div className="lg:col-span-2 h-[380px] sm:h-[450px] rounded-2xl overflow-hidden border border-slate-800 shadow-md relative bg-slate-950">
          <APIProvider apiKey={MAPS_API_KEY}>
            <Map
              center={center}
              zoom={zoom}
              mapId="DEMO_MAP_ID"
              style={{ width: '100%', height: '100%' }}
              gestureHandling="greedy"
              disableDefaultUI={false}
            >
              {locations.map((loc) => {
                const isSelected = selectedLoc?.id === loc.id;
                return (
                  <AdvancedMarker
                    key={loc.id}
                    position={{ lat: loc.lat, lng: loc.lng }}
                    onClick={() => handleSelectLocation(loc)}
                  >
                    <Pin
                      background={
                        isSelected
                          ? '#06b6d4'
                          : loc.category === 'production'
                          ? '#ec4899'
                          : loc.category === 'biotech'
                          ? '#10b981'
                          : '#8b5cf6'
                      }
                      glyphColor="#ffffff"
                      borderColor="#0f172a"
                      scale={isSelected ? 1.25 : 1.0}
                    />
                  </AdvancedMarker>
                );
              })}

              {selectedLoc && (
                <InfoWindow
                  position={{ lat: selectedLoc.lat, lng: selectedLoc.lng }}
                  onCloseClick={() => setSelectedLoc(null)}
                >
                  <div className="text-slate-900 p-1 max-w-[220px]">
                    <h4 className="font-bold text-xs">{selectedLoc.title}</h4>
                    <p className="text-[10px] text-slate-600 mt-0.5">{selectedLoc.address}</p>
                    <p className="text-[10px] text-slate-700 mt-1 line-clamp-2">{selectedLoc.description}</p>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        </div>

        {/* Selected Location Details & Actions */}
        <div className="space-y-3">
          {selectedLoc ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider mb-1 ${
                      selectedLoc.category === 'production'
                        ? 'bg-pink-950 text-pink-300 border border-pink-800/80'
                        : selectedLoc.category === 'biotech'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
                    }`}
                  >
                    {selectedLoc.category}
                  </span>
                  <h3 className="text-sm font-bold text-white">{selectedLoc.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedLoc.address}</p>
                </div>
                {selectedLoc.rating && (
                  <span className="text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800/50">
                    ★ {selectedLoc.rating}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                {selectedLoc.description}
              </p>

              <div className="text-[11px] font-mono text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-900 flex justify-between">
                <span>Lat: {selectedLoc.lat.toFixed(5)}</span>
                <span>Lng: {selectedLoc.lng.toFixed(5)}</span>
              </div>

              {/* Action Buttons: Add to Task / Save Memory */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    onAddTask?.(
                      `Location Scout: ${selectedLoc.title}`,
                      `Coordinate scout at ${selectedLoc.address} (Lat: ${selectedLoc.lat}, Lng: ${selectedLoc.lng}). Notes: ${selectedLoc.description}`
                    );
                    showNotice(`Added "${selectedLoc.title}" to Planner!`);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Location to Tasks</span>
                </button>

                <button
                  onClick={() => {
                    onSaveAsMemory?.(
                      `Location Pin: ${selectedLoc.title}`,
                      `Preferred venue/lab at ${selectedLoc.address}. Lat: ${selectedLoc.lat}, Lng: ${selectedLoc.lng}. Type: ${selectedLoc.category}`
                    );
                    showNotice(`Saved "${selectedLoc.title}" to Personal Memory!`);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Save Location in Memory</span>
                </button>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedLoc.lat},${selectedLoc.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-[11px] font-medium border border-slate-800 transition"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open in Google Maps App</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-500 text-xs">
              Select a location marker on the map to view details.
            </div>
          )}

          {/* Quick Location Cards */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Featured Venues & Nodes
            </h4>
            <div className="space-y-1.5">
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => handleSelectLocation(loc)}
                  className={`w-full text-left p-2 rounded-xl transition text-xs border ${
                    selectedLoc?.id === loc.id
                      ? 'bg-cyan-950/60 border-cyan-800 text-white font-medium'
                      : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">{loc.title}</span>
                    <span className="text-[10px] font-mono text-slate-500">{loc.category}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{loc.address}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
