import { NextRequest, NextResponse } from 'next/server';
import GeminiService, { UserPreferences } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { topics, skillLevel } = body;
    
    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json(
        { error: 'Topics array is required and cannot be empty' },
        { status: 400 }
      );
    }

    if (!skillLevel || !['beginner', 'intermediate', 'advanced'].includes(skillLevel)) {
      return NextResponse.json(
        { error: 'Valid skill level is required (beginner, intermediate, or advanced)' },
        { status: 400 }
      );
    }

    // Build user preferences object
    const preferences: UserPreferences = {
      topics: topics.map((topic: string) => topic.trim()).filter(Boolean),
      skillLevel,
      duration: body.duration || undefined,
      format: body.format || undefined,
      budget: body.budget || undefined
    };

    // Generate recommendations using Gemini AI
    const recommendations = await GeminiService.generateCourseRecommendations(preferences);

    return NextResponse.json(
      {
        success: true,
        preferences,
        recommendations,
        count: recommendations.length,
        generatedAt: new Date().toISOString(),
        apiStatus: process.env.GEMINI_API_KEY ? 'live' : 'mock'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate course recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Support GET requests with query parameters for easier testing
  const { searchParams } = new URL(request.url);
  
  const topics = searchParams.get('topics')?.split(',').map(t => t.trim()) || ['programming'];
  const skillLevel = searchParams.get('skillLevel') as 'beginner' | 'intermediate' | 'advanced' || 'beginner';
  const duration = searchParams.get('duration') || undefined;
  const format = searchParams.get('format') as 'video' | 'text' | 'interactive' | 'any' || undefined;
  const budget = searchParams.get('budget') as 'free' | 'paid' | 'any' || undefined;

  try {
    const preferences: UserPreferences = {
      topics,
      skillLevel,
      duration,
      format,
      budget
    };

    const recommendations = await GeminiService.generateCourseRecommendations(preferences);

    return NextResponse.json(
      {
        success: true,
        preferences,
        recommendations,
        count: recommendations.length,
        generatedAt: new Date().toISOString(),
        apiStatus: process.env.GEMINI_API_KEY ? 'live' : 'mock'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate course recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
