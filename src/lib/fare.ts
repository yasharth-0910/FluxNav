import { PrismaClient } from '@prisma/client';

export class FareCalculator {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  public async calculateFare(distance: number, interchanges: number): Promise<number> {
    const policy = await this.prisma.farePolicy.findFirst();
    
    if (!policy) {
      throw new Error('Fare policy not found');
    }

    // Convert distance from meters to kilometers
    const distanceKm = distance / 1000;
    
    // Calculate base fare
    let fare = policy.baseFare;
    
    // Add distance-based fare
    fare += Math.ceil(distanceKm) * policy.perKmRate;
    
    // Add interchange fees
    fare += interchanges * policy.interchangeFee;
    
    // Convert from paise to rupees
    return fare / 100;
  }
} 