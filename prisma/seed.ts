import { PrismaClient } from '@prisma/client';
import { MetroParser } from '../src/lib/parser';
import path from 'path';

const prisma = new PrismaClient();
const parser = new MetroParser(path.join(process.cwd(), 'datasets'));

async function main() {
  try {
    console.log('Starting database seeding...');
    
    // Clear existing data
    console.log('Clearing existing data...');
    await prisma.edge.deleteMany();
    await prisma.stationLine.deleteMany();
    await prisma.station.deleteMany();
    await prisma.line.deleteMany();
    await prisma.farePolicy.deleteMany();
    console.log('Existing data cleared');

    // Create fare policy
    console.log('Creating fare policy...');
    await prisma.farePolicy.create({
      data: {
        baseFare: 1000, // ₹10
        perKmRate: 200, // ₹2 per km
        interchangeFee: 500, // ₹5 per interchange
      },
    });
    console.log('Fare policy created');

    // Parse and insert lines
    console.log('Parsing lines...');
    const lines = parser.parseAllLines();
    console.log(`Found ${lines.length} lines to process`);

    for (const lineData of lines) {
      console.log(`Processing line: ${lineData.name}`);
      await prisma.line.create({
        data: {
          name: lineData.name,
          color: lineData.color,
        },
      });
    }
    console.log('Lines created');

    // Create stations and station-line relationships
    console.log('Creating stations and relationships...');
    const stationMap = new Map<string, string>(); // normalized name -> id
    const displayNameMap = new Map<string, string>(); // normalized name -> display name

    // First pass: collect all unique station names
    for (const lineData of lines) {
      for (const stationData of lineData.stations) {
        if (!displayNameMap.has(stationData.name)) {
          displayNameMap.set(stationData.name, stationData.name);
        }
      }
    }

    // Second pass: create stations and relationships
    for (const lineData of lines) {
      const line = await prisma.line.findUnique({
        where: { name: lineData.name },
      });

      if (!line) {
        console.error(`Line not found: ${lineData.name}`);
        continue;
      }

      for (let i = 0; i < lineData.stations.length; i++) {
        const stationData = lineData.stations[i];
        let stationId = stationMap.get(stationData.name);

        if (!stationId) {
          const station = await prisma.station.create({
            data: {
              name: stationData.name,
              displayName: stationData.name,
              layout: 'elevated', // Default layout, can be updated later
            },
          });
          stationId = station.id;
          stationMap.set(stationData.name, stationId);
        }

        await prisma.stationLine.upsert({
          where: {
            stationId_lineId: {
              stationId: stationId,
              lineId: line.id
            }
          },
          update: {
            order: i,
            distance: stationData.distance || 0,
          },
          create: {
            station: {
              connect: { id: stationId }
            },
            line: {
              connect: { id: line.id }
            },
            order: i,
            distance: stationData.distance || 0,
          },
        });
      }
    }
    console.log('Stations and relationships created');

    // Create edges
    console.log('Creating edges...');
    const edges = parser.generateEdges(lines);
    console.log(`Found ${edges.length} edges to process`);

    for (const edgeData of edges) {
      const fromStation = await prisma.station.findUnique({
        where: { name: edgeData.fromStation },
      });
      const toStation = await prisma.station.findUnique({
        where: { name: edgeData.toStation },
      });
      const line = await prisma.line.findUnique({
        where: { name: edgeData.lineName },
      });

      if (!fromStation || !toStation || !line) {
        console.error(`Missing data for edge: ${edgeData.fromStation} -> ${edgeData.toStation}`);
        continue;
      }

      await prisma.edge.create({
        data: {
          fromStation: {
            connect: { id: fromStation.id }
          },
          toStation: {
            connect: { id: toStation.id }
          },
          line: {
            connect: { id: line.id }
          },
          distance: edgeData.distance || 0,
        },
      });
    }
    console.log('Edges created');

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 