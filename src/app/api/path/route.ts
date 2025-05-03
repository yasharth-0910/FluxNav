import { NextRequest, NextResponse } from 'next/server';
import { MetroPathFinder } from '@/lib/dijkstra';
import { FareCalculator } from '@/lib/fare';

// Singleton instances
const pathFinder = new MetroPathFinder();
const fareCalculator = new FareCalculator();

// Simple in-memory cache
const pathCache = new Map<string, any>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(from: string, to: string) {
  return `${from}-${to}`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromStation = searchParams.get('from');
    const toStation = searchParams.get('to');

    if (!fromStation || !toStation) {
      return NextResponse.json(
        { error: 'Missing from or to station parameter' },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = getCacheKey(fromStation, toStation);
    const cachedResult = pathCache.get(cacheKey);
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedResult.data);
    }

    // Find shortest path
    const shortestPath = await pathFinder.findShortestPath(fromStation, toStation);
    // Find least interchange path
    const leastInterchangePath = await pathFinder.findLeastInterchangePath(fromStation, toStation);

    // Helper to compare two paths
    function arePathsEqual(a, b) {
      if (!a || !b) return false;
      if (a.path.length !== b.path.length) return false;
      for (let i = 0; i < a.path.length; i++) {
        if (a.path[i].station !== b.path[i].station || a.path[i].line !== b.path[i].line) {
          return false;
        }
      }
      return true;
    }

    let finalShortest = shortestPath;
    let finalLeastInterchange = leastInterchangePath;
    if (arePathsEqual(shortestPath, leastInterchangePath)) {
      finalLeastInterchange = null;
    }

    if (!finalShortest && !finalLeastInterchange) {
      return NextResponse.json(
        { error: 'No path found between stations' },
        { status: 404 }
      );
    }

    // Calculate fares
    const shortestFare = finalShortest
      ? await fareCalculator.calculateFare(finalShortest.totalDistance, finalShortest.interchanges)
      : null;
    const leastInterchangeFare = finalLeastInterchange
      ? await fareCalculator.calculateFare(finalLeastInterchange.totalDistance, finalLeastInterchange.interchanges)
      : null;

    const result = {
      shortest: finalShortest ? { ...finalShortest, fare: shortestFare } : null,
      leastInterchange: finalLeastInterchange ? { ...finalLeastInterchange, fare: leastInterchangeFare } : null,
    };

    // Cache the result
    pathCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error finding path:', error);
    return NextResponse.json(
      { error: 'Failed to find path' },
      { status: 500 }
    );
  }
} 