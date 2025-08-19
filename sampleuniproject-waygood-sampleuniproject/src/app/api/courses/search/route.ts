import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Course from '@/lib/models/Course';
import redisService from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const skillLevel = searchParams.get('skill_level');
    const minRating = searchParams.get('min_rating');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

  
    const cacheKey = `search:${JSON.stringify({
      query: query.toLowerCase(),
      category,
      skillLevel,
      minRating,
      page,
      limit
    })}`;

 const cachedResult = await redisService.get(cacheKey);
    if (cachedResult) {
      const parsed = JSON.parse(cachedResult);
      return NextResponse.json({
        ...parsed,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

   
    const mongoQuery: any = {};

    if (query) {
      mongoQuery.$text = { $search: query };
    }

    
    if (category && category !== 'all') {
      mongoQuery.category = new RegExp(category, 'i');
    }

   
    if (skillLevel && skillLevel !== 'all') {
      mongoQuery.skill_level = skillLevel;
    }

    
    if (minRating) {
      const rating = parseFloat(minRating);
      if (!isNaN(rating)) {
        mongoQuery.rating = { $gte: rating };
      }
    }

    
    const skip = (page - 1) * limit;

    
    const pipeline: any[] = [
      { $match: mongoQuery }
    ];

    
    if (query) {
      pipeline.push({
        $addFields: {
          score: { $meta: "textScore" as const }
        }
      });
    }

        
    if (query) {
      pipeline.push({
        $sort: { score: { $meta: "textScore" as const }, rating: -1 }
      });
    } else {
      pipeline.push({
        $sort: { rating: -1, createdAt: -1 }
      });
    }

    
    pipeline.push({
      $facet: {
        courses: [
          { $skip: skip },
          { $limit: limit }
        ],
        totalCount: [
          { $count: 'count' }
        ],
        categoryStats: [
          {
            $group: {
              _id: '$category',
              count: { $sum: 1 },
              avgRating: { $avg: '$rating' }
            }
          }
        ],
        skillLevelStats: [
          {
            $group: {
              _id: '$skill_level',
              count: { $sum: 1 }
            }
          }
        ]
      }
    });

    const [result] = await Course.aggregate(pipeline);
    const totalCount = result.totalCount[0]?.count || 0;

    const searchResult = {
      success: true,
      courses: result.courses,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCourses: totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      },
      stats: {
        categories: result.categoryStats,
        skillLevels: result.skillLevelStats
      },
      searchQuery: {
        query,
        category,
        skillLevel,
        minRating
      },
      cached: false,
      timestamp: new Date().toISOString()
    };

   
    await redisService.set(cacheKey, JSON.stringify(searchResult), 600);

    return NextResponse.json(searchResult);

  } catch (error) {
    console.error('Course search error:', error);
    return NextResponse.json(
      {
        error: 'Failed to search courses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      query = '', 
      filters = {}, 
      sort = { rating: -1 }, 
      page = 1, 
      limit = 20 
    } = body;

    await dbConnect();

    
    const mongoQuery: any = {};

    if (query) {
      mongoQuery.$or = [
        { title: new RegExp(query, 'i') },
        { description: new RegExp(query, 'i') },
        { instructor: new RegExp(query, 'i') },
        { category: new RegExp(query, 'i') }
      ];
    }

   
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        if (key === 'rating') {
          mongoQuery[key] = { $gte: parseFloat(filters[key]) };
        } else if (key === 'price_range') {
         
          const priceRange = filters[key];
          if (priceRange === 'free') {
            mongoQuery.price = new RegExp('free', 'i');
          } else if (priceRange === 'paid') {
            mongoQuery.price = { $not: new RegExp('free', 'i') };
          }
        } else {
          mongoQuery[key] = filters[key];
        }
      }
    });

    const cacheKey = `advanced_search:${JSON.stringify({ query, filters, sort, page, limit })}`;
    const cachedResult = await redisService.get(cacheKey);

    if (cachedResult) {
      return NextResponse.json(JSON.parse(cachedResult));
    }

    const skip = (page - 1) * limit;
    const [courses, totalCount] = await Promise.all([
      Course.find(mongoQuery)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Course.countDocuments(mongoQuery)
    ]);

    const result = {
      success: true,
      courses,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCourses: totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      },
      searchParams: { query, filters, sort }
    };

    
    await redisService.set(cacheKey, JSON.stringify(result), 300);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Advanced course search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform advanced search' },
      { status: 500 }
    );
  }
}
