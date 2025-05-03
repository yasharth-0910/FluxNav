import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Station {
  id: string;
  name: string;
}

interface StationSelectorProps {
  label: string;
  stations: Station[];
  value: string;
  onChange: (value: string) => void;
  onSwap?: () => void;
  showSwap?: boolean;
}

export default function StationSelector({
  label,
  stations,
  value,
  onChange,
  onSwap,
  showSwap = false,
}: StationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredStations = stations.filter(station =>
    station.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedStation = stations.find(station => station.name === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <div
          className="flex items-center justify-between w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg cursor-pointer hover:border-white/40 transition-all duration-200 hover:shadow-lg hover:shadow-white/5"
          onClick={() => setIsOpen(!isOpen)}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="station-list"
        >
          <div className="flex items-center gap-2">
            <MagnifyingGlassIcon className="w-5 h-5 text-white/60" />
            <span className="text-white">
              {selectedStation?.name || 'Select station'}
            </span>
          </div>
          {showSwap && onSwap && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSwap();
              }}
              className="p-1 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Swap stations"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-white/60"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                />
              </svg>
            </button>
          )}
        </div>
        {isOpen && (
          <div 
            className="absolute z-10 w-full mt-1 bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg max-h-60 overflow-auto transform transition-all duration-200 origin-top"
            id="station-list"
            role="listbox"
          >
            <div className="sticky top-0 p-2 bg-gray-900/95">
              <input
                ref={inputRef}
                type="text"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Search station..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                aria-label="Search stations"
              />
            </div>
            {filteredStations.length === 0 ? (
              <div className="px-4 py-2 text-white/60 text-center">
                No stations found
              </div>
            ) : (
              filteredStations.map((station) => (
                <div
                  key={station.id}
                  className="px-4 py-2 hover:bg-white/10 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                  onClick={() => {
                    onChange(station.name);
                    setIsOpen(false);
                  }}
                  role="option"
                  aria-selected={station.name === value}
                >
                  <span className="text-white">{station.name}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
} 