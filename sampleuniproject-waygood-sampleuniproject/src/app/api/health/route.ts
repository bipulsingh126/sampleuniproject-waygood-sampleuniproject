import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import redisService from '@/lib/redis';

export async function GET() {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: 'unknown',
      redis: 'unknown',
      gemini: 'unknown'
    },
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime()
  };

  // Check MongoDB connection
  try {
    await dbConnect();
    healthCheck.services.mongodb = 'connected';
  } catch (error) {
    healthCheck.services.mongodb = 'disconnected';
    healthCheck.status = 'degraded';
  }

  // Check Redis connection
  try {
    await redisService.get('health-check');
    healthCheck.services.redis = 'connected';
  } catch (error) {
    healthCheck.services.redis = 'disconnected';
    // Redis is optional, don't mark as degraded
  }

  // Check Gemini API availability
  healthCheck.services.gemini = process.env.GEMINI_API_KEY ? 'configured' : 'not-configured';

  return NextResponse.json(healthCheck, {
    status: healthCheck.status === 'healthy' ? 200 : 503
  });
}
