import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const lines = await prisma.line.findMany({
      include: {
        stations: {
          include: {
            station: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return NextResponse.json(lines);
  } catch (error) {
    console.error('Error fetching lines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lines' },
      { status: 500 }
    );
  }
} 