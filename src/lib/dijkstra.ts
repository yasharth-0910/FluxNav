import { PrismaClient } from '@prisma/client';

interface StationNode {
  id: string;
  name: string;
  distance: number;
  previous: string | null;
  lineId: string | null;
}

interface PathResult {
  path: {
    station: string;
    line: string;
  }[];
  totalDistance: number;
  interchanges: number;
}

interface Edge {
  fromStationId: string;
  toStationId: string;
  distance: number;
  lineId: string;
}

interface Line {
  id: string;
  name: string;
}

export class MetroPathFinder {
  private prisma: PrismaClient;
  private stationCache: Map<string, string>; // name -> id
  private lineCache: Map<string, Line>; // id -> line
  private graphCache: Map<string, StationNode> | null;
  private edgesCache: Edge[] | null;

  constructor() {
    this.prisma = new PrismaClient();
    this.stationCache = new Map();
    this.lineCache = new Map();
    this.graphCache = null;
    this.edgesCache = null;
  }

  private async initializeCaches() {
    if (this.graphCache && this.edgesCache) return;

    // Load all stations
    const stations = await this.prisma.station.findMany();
    this.graphCache = new Map();
    for (const station of stations) {
      this.stationCache.set(station.name, station.id);
      this.graphCache.set(station.id, {
        id: station.id,
        name: station.name,
        distance: Infinity,
        previous: null,
        lineId: null,
      });
    }

    // Load all lines
    const lines = await this.prisma.line.findMany();
    for (const line of lines) {
      this.lineCache.set(line.id, line);
    }

    // Load all edges
    this.edgesCache = await this.prisma.edge.findMany();
  }

  private getAdjacentStations(stationId: string): { id: string; distance: number; lineId: string }[] {
    if (!this.edgesCache) throw new Error('Edges cache not initialized');
    
    return this.edgesCache
      .filter(edge => edge.fromStationId === stationId || edge.toStationId === stationId)
      .map(edge => ({
        id: edge.fromStationId === stationId ? edge.toStationId : edge.fromStationId,
        distance: edge.distance,
        lineId: edge.lineId,
      }));
  }

  private findStationByName(name: string): string | null {
    return this.stationCache.get(name) || null;
  }

  private reconstructPath(endId: string): PathResult {
    if (!this.graphCache) throw new Error('Graph cache not initialized');

    const path: { station: string; line: string }[] = [];
    let currentId = endId;
    let interchanges = 0;
    let totalDistance = 0;

    while (currentId) {
      const node = this.graphCache.get(currentId);
      if (!node) break;

      const line = node.lineId ? this.lineCache.get(node.lineId) : null;

      path.unshift({
        station: node.name,
        line: line?.name || 'Unknown',
      });

      if (node.previous) {
        const prevNode = this.graphCache.get(node.previous);
        if (prevNode?.lineId !== node.lineId) {
          interchanges++;
        }
        totalDistance += node.distance;
      }

      currentId = node.previous || '';
    }

    return {
      path,
      totalDistance,
      interchanges,
    };
  }

  public async findShortestPath(
    fromStation: string,
    toStation: string
  ): Promise<PathResult | null> {
    await this.initializeCaches();
    if (!this.graphCache) throw new Error('Graph cache not initialized');

    const startId = this.findStationByName(fromStation);
    const endId = this.findStationByName(toStation);

    if (!startId || !endId) {
      return null;
    }

    const unvisited = new Set<string>(this.graphCache.keys());
    const startNode = this.graphCache.get(startId);

    if (!startNode) {
      return null;
    }

    startNode.distance = 0;
    this.graphCache.set(startId, startNode);

    // Use a priority queue for unvisited nodes
    const priorityQueue = new Map<string, number>();
    priorityQueue.set(startId, 0);

    while (priorityQueue.size > 0) {
      // Get node with minimum distance
      let currentId = '';
      let minDistance = Infinity;
      for (const [id, distance] of priorityQueue) {
        if (distance < minDistance) {
          minDistance = distance;
          currentId = id;
        }
      }

      if (!currentId) break;

      priorityQueue.delete(currentId);
      unvisited.delete(currentId);
      const current = this.graphCache.get(currentId);

      if (!current || current.distance === Infinity) continue;

      // Early exit if we've reached the destination
      if (currentId === endId) {
        return this.reconstructPath(endId);
      }

      const neighbors = this.getAdjacentStations(currentId);

      for (const neighbor of neighbors) {
        if (!unvisited.has(neighbor.id)) continue;

        const distance = current.distance + neighbor.distance;
        const neighborNode = this.graphCache.get(neighbor.id);

        if (neighborNode && distance < neighborNode.distance) {
          neighborNode.distance = distance;
          neighborNode.previous = currentId;
          neighborNode.lineId = neighbor.lineId;
          this.graphCache.set(neighbor.id, neighborNode);
          priorityQueue.set(neighbor.id, distance);
        }
      }
    }

    return this.reconstructPath(endId);
  }

  public async findLeastInterchangePath(
    fromStation: string,
    toStation: string
  ): Promise<PathResult | null> {
    await this.initializeCaches();
    if (!this.graphCache) throw new Error('Graph cache not initialized');

    const startId = this.findStationByName(fromStation);
    const endId = this.findStationByName(toStation);
    if (!startId || !endId) return null;

    // BFS queue: [currentId, path, interchanges, prevLineId, totalDistance]
    const queue: [string, { station: string; line: string }[], number, string | null, number][] = [
      [startId, [], 0, null, 0],
    ];
    const visited = new Map<string, number>(); // stationId|lineId -> interchanges
    let bestPath: PathResult | null = null;

    while (queue.length > 0) {
      const [currentId, pathSoFar, interchanges, prevLineId, totalDistance] = queue.shift()!;
      const node = this.graphCache.get(currentId);
      if (!node) continue;
      const line = prevLineId ? this.lineCache.get(prevLineId) : null;
      const newPath = [
        ...pathSoFar,
        { station: node.name, line: line?.name || 'Unknown' },
      ];
      if (currentId === endId) {
        if (
          !bestPath ||
          interchanges < bestPath.interchanges ||
          (interchanges === bestPath.interchanges && totalDistance < bestPath.totalDistance)
        ) {
          bestPath = {
            path: newPath,
            totalDistance,
            interchanges,
          };
        }
        continue;
      }
      const neighbors = this.getAdjacentStations(currentId);
      for (const neighbor of neighbors) {
        const nextInterchanges = prevLineId && neighbor.lineId !== prevLineId ? interchanges + 1 : interchanges;
        const visitKey = neighbor.id + '|' + neighbor.lineId;
        if (visited.has(visitKey) && visited.get(visitKey)! <= nextInterchanges) continue;
        visited.set(visitKey, nextInterchanges);
        queue.push([
          neighbor.id,
          newPath,
          nextInterchanges,
          neighbor.lineId,
          totalDistance + neighbor.distance,
        ]);
      }
    }
    return bestPath;
  }
} 