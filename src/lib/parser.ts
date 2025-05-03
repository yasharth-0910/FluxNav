import fs from 'fs';
import path from 'path';

export interface StationData {
  name: string;
  distance: number;
}

export interface LineData {
  name: string;
  color: string;
  stations: StationData[];
}

export interface EdgeData {
  fromStation: string;
  toStation: string;
  distance: number;
  lineName: string;
}

export class MetroParser {
  private readonly dataDir: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
  }

  private normalizeStationName(name: string): string {
    // Remove spaces and special characters, convert to lowercase
    return name
      .trim()
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
  }

  private parseLineFile(filePath: string): LineData {
    const fileName = path.basename(filePath, '.txt');
    const color = fileName;
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const stations: StationData[] = content
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [name, distanceStr] = line.split(/\s+/);
        const distance = parseInt(distanceStr.replace(',', ''), 10);
        return { 
          name: this.normalizeStationName(name),
          distance 
        };
      });

    return {
      name: color.charAt(0).toUpperCase() + color.slice(1) + ' Line',
      color,
      stations
    };
  }

  public parseAllLines(): LineData[] {
    const files = fs.readdirSync(this.dataDir)
      .filter(file => file.endsWith('.txt'));

    return files.map(file => 
      this.parseLineFile(path.join(this.dataDir, file))
    );
  }

  public generateEdges(lines: LineData[]): EdgeData[] {
    const edges: EdgeData[] = [];

    for (const line of lines) {
      for (let i = 0; i < line.stations.length - 1; i++) {
        const fromStation = line.stations[i];
        const toStation = line.stations[i + 1];
        
        edges.push({
          fromStation: fromStation.name,
          toStation: toStation.name,
          distance: toStation.distance - fromStation.distance,
          lineName: line.name
        });
      }
    }

    return edges;
  }

  public findInterchangeStations(lines: LineData[]): string[] {
    const stationCount = new Map<string, number>();
    
    for (const line of lines) {
      for (const station of line.stations) {
        stationCount.set(
          station.name,
          (stationCount.get(station.name) || 0) + 1
        );
      }
    }

    return Array.from(stationCount.entries())
      .filter(([_, count]) => count > 1)
      .map(([name]) => name);
  }
} 