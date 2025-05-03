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

    if (!shortestPath && !leastInterchangePath) {
      return NextResponse.json(
        { error: 'No path found between stations' },
        { status: 404 }
      );
    }

    // Calculate fares
    const shortestFare = shortestPath
      ? await fareCalculator.calculateFare(shortestPath.totalDistance, shortestPath.interchanges)
      : null;
    const leastInterchangeFare = leastInterchangePath
      ? await fareCalculator.calculateFare(leastInterchangePath.totalDistance, leastInterchangePath.interchanges)
      : null;

    const result = {
      shortest: shortestPath ? { ...shortestPath, fare: shortestFare } : null,
      leastInterchange: leastInterchangePath ? { ...leastInterchangePath, fare: leastInterchangeFare } : null,
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