import { useEffect, useState } from 'react';
import { ArrowPathIcon, ClockIcon, CurrencyRupeeIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface RouteStep {
  station: string;
  line: string;
}

interface RouteVisualizationProps {
  path: RouteStep[];
  interchanges: number;
  label?: string;
}

const lineColors: { [key: string]: string } = {
  'Blue Line': 'bg-blue-500',
  'Red Line': 'bg-red-500',
  'Yellow Line': 'bg-yellow-500',
  'Green Line': 'bg-green-500',
  'Violet Line': 'bg-violet-500',
  'Magenta Line': 'bg-pink-500',
  'Orange Line': 'bg-orange-500',
};

const lineTextColors: { [key: string]: string } = {
  'Blue Line': 'text-blue-400',
  'Red Line': 'text-red-400',
  'Yellow Line': 'text-yellow-400',
  'Green Line': 'text-green-400',
  'Violet Line': 'text-violet-400',
  'Magenta Line': 'text-pink-400',
  'Orange Line': 'text-orange-400',
};

export default function RouteVisualization({
  path,
  interchanges,
  label,
}: RouteVisualizationProps) {
  const [visibleStations, setVisibleStations] = useState<number>(0);

  useEffect(() => {
    setVisibleStations(0);
    const interval = setInterval(() => {
      setVisibleStations((prev) => {
        if (prev >= path.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [path]);

  const showInterchangeNA = (interchanges === 0 && path.length > 1);

  return (
    <div className="mt-8">
      {label && (
        <div className="mb-4 text-xl font-bold text-center text-white/90 tracking-wide">
          {label}
        </div>
      )}
      {showInterchangeNA && (
        <div className="mb-4 text-center text-yellow-400 font-semibold">⚠️ Route stats may be incomplete or suspicious</div>
      )}
      <div className="grid grid-cols-1 gap-4 mb-8">
        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg transform transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-2 mb-2">
            <ArrowPathIcon className="w-5 h-5 text-white/60" />
            <h3 className="text-sm text-gray-300">Interchanges</h3>
          </div>
          <p className="text-2xl font-bold text-white">{showInterchangeNA ? '-' : interchanges}</p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-1 bg-white/20 rounded-full" />
        {path.map((step, index) => (
          <div
            key={index}
            className={`relative pl-12 py-4 ${
              index < visibleStations ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            } transition-all duration-500 ease-out`}
          >
            <div
              className={`absolute left-4 w-4 h-4 rounded-full ${
                lineColors[step.line] || 'bg-gray-500'
              } transform transition-transform duration-300 hover:scale-125`}
            />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-white">{step.station}</h3>
                <p className={`text-sm ${lineTextColors[step.line] || 'text-gray-400'}`}>
                  {step.line}
                </p>
              </div>
              {index < path.length - 1 && (
                <div
                  className={`w-16 h-1 ${
                    lineColors[path[index + 1].line] || 'bg-gray-500'
                  } transform transition-transform duration-300 hover:scale-x-110`}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {interchanges > 0 && (
        <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg transform transition-all duration-300 hover:scale-[1.02]">
          <h3 className="text-yellow-400 font-medium mb-2 flex items-center gap-2">
            <ArrowPathIcon className="w-5 h-5" />
            Travel Tips
          </h3>
          <ul className="text-yellow-300/80 text-sm space-y-1">
            <li>• Interchange at Rajiv Chowk is usually crowded during peak hours</li>
            <li>• Avoid peak hours between 9–10 AM and 5–7 PM</li>
            <li>• Keep your metro card ready at interchanges</li>
            <li>• Check for any service updates or delays before starting your journey</li>
          </ul>
        </div>
      )}
    </div>
  );
} 