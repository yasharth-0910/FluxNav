'use client';

import { useState, useEffect } from 'react';
import StationSelector from '@/components/StationSelector';
import RouteVisualization from '@/components/RouteVisualization';
import CityScape from '@/components/CityScape';
import DelhiMetroLogo from '@/components/DelhiMetroLogo';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { askGemini } from '@/lib/gemini';
import ReactMarkdown from 'react-markdown';

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

interface MultiRouteResult {
  shortest: PathResult | null;
  leastInterchange: PathResult | null;
}

export default function Home() {
  const [stations, setStations] = useState<Station[]>([]);
  const [fromStation, setFromStation] = useState('');
  const [toStation, setToStation] = useState('');
  const [result, setResult] = useState<MultiRouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [explanations, setExplanations] = useState<{ [key: string]: string }>({});
  const [tips, setTips] = useState<{ [key: string]: string[] }>({});
  const [accessNotes, setAccessNotes] = useState<{ [key: string]: string }>({});
  const [compareSummary, setCompareSummary] = useState<string>('');
  const [compareLoading, setCompareLoading] = useState(false);
  const [faqInput, setFaqInput] = useState('');
  const [faqHistory, setFaqHistory] = useState<{ q: string; a: string }[]>([]);
  const [faqLoading, setFaqLoading] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const response = await fetch('/api/stations');
      const data = await response.json();
      setStations(data);
    } catch (error) {
      console.error('Error fetching stations:', error);
      setError('Failed to load stations');
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
        setResult({
          shortest: data.shortest,
          leastInterchange: data.leastInterchange,
        });
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

  // Helper to get a unique key for a route
  const routeKey = (route: PathResult | null, label: string) => {
    if (!route) return label;
    return label + ':' + route.path.map(s => s.station + '-' + s.line).join('>');
  };

  // Gemini-powered actions
  const handleExplain = async (route: PathResult | null, label: string) => {
    if (!route) return;
    const key = routeKey(route, label);
    setLoadingKeys(lk => ({ ...lk, [key + ':explain']: true }));
    const prompt = `Explain in simple terms why this is a good route from ${fromStation} to ${toStation} in the Delhi Metro: ${route.path.map(s => s.station + ' (' + s.line + ')').join(' -> ')}`;
    const text = await askGemini(prompt);
    setExplanations(e => ({ ...e, [key]: text }));
    setLoadingKeys(lk => ({ ...lk, [key + ':explain']: false }));
  };
  const handleTips = async (route: PathResult | null, label: string) => {
    if (!route) return;
    const key = routeKey(route, label);
    setLoadingKeys(lk => ({ ...lk, [key + ':tips']: true }));
    const prompt = `Give 3 travel tips for someone taking the Delhi Metro from ${fromStation} to ${toStation} along this route: ${route.path.map(s => s.station + ' (' + s.line + ')').join(' -> ')}`;
    const text = await askGemini(prompt);
    setTips(t => ({ ...t, [key]: text.split(/\n|\r|\d+\.|•/).filter(Boolean).map(s => s.trim()).filter(Boolean) }));
    setLoadingKeys(lk => ({ ...lk, [key + ':tips']: false }));
  };
  const handleAccess = async (route: PathResult | null, label: string) => {
    if (!route) return;
    const key = routeKey(route, label);
    setLoadingKeys(lk => ({ ...lk, [key + ':access']: true }));
    const prompt = `Give a short accessibility and safety note for this Delhi Metro route from ${fromStation} to ${toStation}: ${route.path.map(s => s.station + ' (' + s.line + ')').join(' -> ')}`;
    const text = await askGemini(prompt);
    setAccessNotes(a => ({ ...a, [key]: text }));
    setLoadingKeys(lk => ({ ...lk, [key + ':access']: false }));
  };
  const handleCompare = async () => {
    if (!result?.shortest || !result?.leastInterchange) return;
    setCompareLoading(true);
    const prompt = `Compare these two Delhi Metro routes from ${fromStation} to ${toStation}. Route 1: ${result.shortest.path.map(s => s.station + ' (' + s.line + ')').join(' -> ')}. Route 2: ${result.leastInterchange.path.map(s => s.station + ' (' + s.line + ')').join(' -> ')}. Which is better for a tourist and why?`;
    const text = await askGemini(prompt);
    setCompareSummary(text);
    setCompareLoading(false);
  };
  const handleFaq = async () => {
    if (!faqInput.trim()) return;
    setFaqLoading(true);
    const prompt = `Delhi Metro user question: ${faqInput}`;
    const text = await askGemini(prompt);
    setFaqHistory(h => [...h, { q: faqInput, a: text }]);
    setFaqInput('');
    setFaqLoading(false);
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
            {result && (result.shortest || result.leastInterchange) && (
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
                  <div className="flex flex-col md:flex-row gap-8">
                    {result.shortest && (
                      <div className="flex-1">
                        <RouteVisualization
                          {...result.shortest}
                          label="Fastest Route"
                        />
                        {/* Gemini-powered actions */}
                        <div className="flex flex-wrap gap-2 mt-4">
                          <button onClick={() => handleExplain(result.shortest, 'Fastest Route')} className="px-3 py-1 rounded bg-blue-700 hover:bg-blue-800 text-white text-sm">Explain this route</button>
                          <button onClick={() => handleTips(result.shortest, 'Fastest Route')} className="px-3 py-1 rounded bg-green-700 hover:bg-green-800 text-white text-sm">Get travel tips</button>
                          <button onClick={() => handleAccess(result.shortest, 'Fastest Route')} className="px-3 py-1 rounded bg-yellow-700 hover:bg-yellow-800 text-white text-sm">Accessibility/Safety note</button>
                        </div>
                        {/* Results */}
                        {loadingKeys[routeKey(result.shortest, 'Fastest Route') + ':explain'] && <div className="mt-2 text-blue-300">Loading explanation...</div>}
                        {explanations[routeKey(result.shortest, 'Fastest Route')] && (
                          <div className="mt-2 text-blue-200 bg-blue-900/30 p-2 rounded prose prose-invert">
                            <ReactMarkdown>
                              {explanations[routeKey(result.shortest, 'Fastest Route')]}
                            </ReactMarkdown>
                          </div>
                        )}
                        {loadingKeys[routeKey(result.shortest, 'Fastest Route') + ':tips'] && <div className="mt-2 text-green-300">Loading tips...</div>}
                        {tips[routeKey(result.shortest, 'Fastest Route')] && <ul className="mt-2 text-green-200 bg-green-900/30 p-2 rounded list-disc list-inside">{tips[routeKey(result.shortest, 'Fastest Route')].map((tip, i) => <li key={i}>{tip}</li>)}</ul>}
                        {loadingKeys[routeKey(result.shortest, 'Fastest Route') + ':access'] && <div className="mt-2 text-yellow-300">Loading note...</div>}
                        {accessNotes[routeKey(result.shortest, 'Fastest Route')] && (
                          <div className="mt-2 text-yellow-200 bg-yellow-900/30 p-2 rounded prose prose-invert">
                            <ReactMarkdown>
                              {accessNotes[routeKey(result.shortest, 'Fastest Route')]}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    )}
                    {result.leastInterchange && (
                      <div className="flex-1">
                        <RouteVisualization
                          {...result.leastInterchange}
                          label="Least Interchanges"
                        />
                        {/* Gemini-powered actions */}
                        <div className="flex flex-wrap gap-2 mt-4">
                          <button onClick={() => handleExplain(result.leastInterchange, 'Least Interchanges')} className="px-3 py-1 rounded bg-blue-700 hover:bg-blue-800 text-white text-sm">Explain this route</button>
                          <button onClick={() => handleTips(result.leastInterchange, 'Least Interchanges')} className="px-3 py-1 rounded bg-green-700 hover:bg-green-800 text-white text-sm">Get travel tips</button>
                          <button onClick={() => handleAccess(result.leastInterchange, 'Least Interchanges')} className="px-3 py-1 rounded bg-yellow-700 hover:bg-yellow-800 text-white text-sm">Accessibility/Safety note</button>
                        </div>
                        {/* Results */}
                        {loadingKeys[routeKey(result.leastInterchange, 'Least Interchanges') + ':explain'] && <div className="mt-2 text-blue-300">Loading explanation...</div>}
                        {explanations[routeKey(result.leastInterchange, 'Least Interchanges')] && (
                          <div className="mt-2 text-blue-200 bg-blue-900/30 p-2 rounded prose prose-invert">
                            <ReactMarkdown>
                              {explanations[routeKey(result.leastInterchange, 'Least Interchanges')]}
                            </ReactMarkdown>
                          </div>
                        )}
                        {loadingKeys[routeKey(result.leastInterchange, 'Least Interchanges') + ':tips'] && <div className="mt-2 text-green-300">Loading tips...</div>}
                        {tips[routeKey(result.leastInterchange, 'Least Interchanges')] && <ul className="mt-2 text-green-200 bg-green-900/30 p-2 rounded list-disc list-inside">{tips[routeKey(result.leastInterchange, 'Least Interchanges')].map((tip, i) => <li key={i}>{tip}</li>)}</ul>}
                        {loadingKeys[routeKey(result.leastInterchange, 'Least Interchanges') + ':access'] && <div className="mt-2 text-yellow-300">Loading note...</div>}
                        {accessNotes[routeKey(result.leastInterchange, 'Least Interchanges')] && (
                          <div className="mt-2 text-yellow-200 bg-yellow-900/30 p-2 rounded prose prose-invert">
                            <ReactMarkdown>
                              {accessNotes[routeKey(result.leastInterchange, 'Least Interchanges')]}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Gemini-powered route comparison */}
                  {result.shortest && result.leastInterchange && (
                    <div className="mt-8">
                      <button onClick={handleCompare} className="px-4 py-2 rounded bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold">Compare these routes (AI)</button>
                      {compareLoading && <div className="mt-2 text-purple-300">Loading comparison...</div>}
                      {compareSummary && (
                        <div className="mt-2 text-purple-200 bg-purple-900/30 p-2 rounded prose prose-invert">
                          <ReactMarkdown>
                            {compareSummary}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex justify-end mt-8">
                    <button
                      className="px-6 py-2 rounded-lg bg-gradient-to-r from-gray-700 to-gray-800 text-white font-semibold shadow hover:from-red-500 hover:to-yellow-500 hover:text-black transition-all"
                      onClick={() => {
                        setResult(null);
                        setFromStation('');
                        setToStation('');
                        setExplanations({});
                        setTips({});
                        setAccessNotes({});
                        setCompareSummary('');
                      }}
                    >
                      Plan Another Route
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Gemini-powered FAQ/Chat */}
            <div className="mt-16 bg-gray-800/80 border border-white/10 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold mb-2 text-white">Ask AI about Delhi Metro</h3>
              <div className="flex gap-2 mb-4">
                <input
                  className="flex-1 px-3 py-2 rounded bg-gray-900 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Ask anything about Delhi Metro..."
                  value={faqInput}
                  onChange={e => setFaqInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleFaq(); }}
                  disabled={faqLoading}
                />
                <button
                  className="px-4 py-2 rounded bg-blue-700 hover:bg-blue-800 text-white font-semibold"
                  onClick={handleFaq}
                  disabled={faqLoading}
                >Ask</button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-4">
                {faqHistory.map((item, i) => (
                  <div key={i} className="bg-gray-900/80 p-3 rounded">
                    <div className="text-red-300 font-semibold">Q: {item.q}</div>
                    <div className="text-green-200 mt-1 prose prose-invert">
                      <ReactMarkdown>
                        {item.a}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
                {faqLoading && <div className="text-blue-300">AI is thinking...</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 