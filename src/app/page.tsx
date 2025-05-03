'use client';

import { useState, useEffect } from 'react';
import StationSelector from '@/components/StationSelector';
import RouteVisualization from '@/components/RouteVisualization';
import CityScape from '@/components/CityScape';
import DelhiMetroLogo from '@/components/DelhiMetroLogo';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface Station {
  id: string;
  name: string;
}

interface PathResult {
  path: {
    station: string;
    line: string;
  }[];
  totalDistance: number;
  interchanges: number;
  fare: number;
}

export default function Home() {
  const [stations, setStations] = useState<Station[]>([]);
  const [fromStation, setFromStation] = useState('');
  const [toStation, setToStation] = useState('');
  const [result, setResult] = useState<PathResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const response = await fetch('/api/stations');
      const data = await response.json();
      setStations(data);
      setIsInitialLoad(false);
    } catch (error) {
      console.error('Error fetching stations:', error);
      setError('Failed to load stations');
      setIsInitialLoad(false);
    }
  };

  const findPath = async () => {
    if (!fromStation || !toStation) {
      setError('Please select both stations');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(
        `/api/path?from=${encodeURIComponent(fromStation)}&to=${encodeURIComponent(toStation)}`
      );
      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to find path');
      }
    } catch (error) {
      console.error('Error finding path:', error);
      setError('Failed to find path');
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    setFromStation(toStation);
    setToStation(fromStation);
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black opacity-90" />
      <CityScape />
      <div className="absolute inset-0 bg-[url('/stars.png')] opacity-20" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="py-6 px-4 md:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <DelhiMetroLogo />
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
              Delhi Metro Route Planner
            </h1>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-4xl">
            {/* Search Panel */}
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-white/20 rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-visible">
              <h2 className="text-3xl font-bold mb-2">Where are you going today?</h2>
              <p className="text-gray-300 mb-8">Plan the fastest route through the Delhi Metro.</p>

              <div className="relative flex flex-col gap-8">
                <StationSelector
                  label="From Station"
                  stations={stations}
                  value={fromStation}
                  onChange={setFromStation}
                />

                {/* Divider and Floating Swap Button */}
                <div className="relative flex items-center justify-center my-2">
                  <div className="w-full h-px bg-white/10" />
                  <button
                    onClick={handleSwap}
                    className="absolute left-1/2 -translate-x-1/2 -top-6 z-10 p-3 bg-gradient-to-br from-red-500 to-yellow-500 shadow-lg rounded-full border-4 border-gray-900 hover:scale-110 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label="Swap stations"
                    style={{ boxShadow: '0 4px 24px 0 rgba(255,0,0,0.10)' }}
                  >
                    <ArrowPathIcon className="w-6 h-6 text-white" />
                  </button>
                </div>

                <StationSelector
                  label="To Station"
                  stations={stations}
                  value={toStation}
                  onChange={setToStation}
                />

                <button
                  onClick={findPath}
                  disabled={loading || !fromStation || !toStation}
                  className="w-full py-3 px-4 mt-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg font-semibold text-white text-lg shadow-lg hover:shadow-red-500/20 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                      Finding Route...
                    </div>
                  ) : (
                    'Find My Route'
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg transform transition-all duration-300">
                  <p className="text-red-400">{error}</p>
                </div>
              )}
            </div>

            {/* Results */}
            {result && (
              <div className="mt-12 animate-fade-in-up">
                <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-white/20 rounded-2xl shadow-2xl p-8 md:p-12 relative">
                  {/* Header with route summary */}
                  <div className="flex items-center gap-4 mb-8">
                    <span className="text-lg font-semibold text-white bg-red-500/20 px-4 py-2 rounded-lg">
                      {fromStation || 'From'}
                    </span>
                    <ArrowPathIcon className="w-7 h-7 text-red-400" />
                    <span className="text-lg font-semibold text-white bg-yellow-500/20 px-4 py-2 rounded-lg">
                      {toStation || 'To'}
                    </span>
                  </div>
                  <RouteVisualization
                    path={result.path}
                    totalDistance={result.totalDistance}
                    interchanges={result.interchanges}
                    fare={result.fare}
                  />
                  <div className="flex justify-end mt-8">
                    <button
                      className="px-6 py-2 rounded-lg bg-gradient-to-r from-gray-700 to-gray-800 text-white font-semibold shadow hover:from-red-500 hover:to-yellow-500 hover:text-black transition-all"
                      onClick={() => {
                        setResult(null);
                        setFromStation('');
                        setToStation('');
                      }}
                    >
                      Plan Another Route
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 