import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Course from '@/lib/models/Course';
import redisService from '@/lib/redis';
import { parseCSVBuffer, validateCourseData, type CSVCourseData } from '@/lib/csv-parser';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = isAuthenticated(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    await dbConnect();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.type !== 'text/csv') {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a CSV file.' },
        { status: 400 }
      );
    }

    // Parse CSV file
    const buffer = Buffer.from(await file.arrayBuffer());
    let csvData: CSVCourseData[];

    try {
      csvData = await parseCSVBuffer(buffer);
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to parse CSV file', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 400 }
      );
    }

    if (csvData.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty or contains no valid data' },
        { status: 400 }
      );
    }

    // Validate and process data
    const validCourses = [];
    const errors = [];

    for (let i = 0; i < csvData.length; i++) {
      const courseData = csvData[i];
      const validationErrors = validateCourseData(courseData);

      if (validationErrors.length > 0) {
        errors.push({
          row: i + 2, // +2 because CSV rows start at 1 and we skip header
          course_id: courseData.course_id,
          errors: validationErrors
        });
        continue;
      }

      // Transform data for MongoDB
      const courseDoc = {
        course_id: courseData.course_id,
        title: courseData.title,
        description: courseData.description,
        category: courseData.category,
        instructor: courseData.instructor,
        duration: courseData.duration,
        price: courseData.price,
        rating: parseFloat(courseData.rating) || 0,
        skill_level: courseData.skill_level as 'beginner' | 'intermediate' | 'advanced' || 'beginner'
      };

      validCourses.push(courseDoc);
    }

    // Insert valid courses into database
    let insertedCount = 0;
    let duplicateCount = 0;

    if (validCourses.length > 0) {
      try {
        // Use insertMany with ordered: false to continue on duplicates
        const result = await Course.insertMany(validCourses, { ordered: false });
        insertedCount = result.length;
      } catch (error: any) {
        // Handle duplicate key errors
        if (error.code === 11000) {
          // Count successful inserts vs duplicates
          const writeErrors = error.writeErrors || [];
          insertedCount = validCourses.length - writeErrors.length;
          duplicateCount = writeErrors.length;
        } else {
          throw error;
        }
      }

      // Clear related cache entries
      await redisService.flushPattern('courses:*');
      await redisService.flushPattern('search:*');
    }

    return NextResponse.json({
      success: true,
      message: 'Course upload completed',
      summary: {
        totalRows: csvData.length,
        validCourses: validCourses.length,
        insertedCourses: insertedCount,
        duplicateCourses: duplicateCount,
        errorRows: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    }, { status: 200 });

  } catch (error) {
    console.error('Course upload error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error during course upload',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Check authentication for GET endpoint too
  const user = isAuthenticated(request);
  if (!user || !isAdmin(user)) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin access required.' },
      { status: 401 }
    );
  }

  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const skillLevel = searchParams.get('skill_level');

    // Build query
    const query: any = {};
    if (category) query.category = category;
    if (skillLevel) query.skill_level = skillLevel;

    // Check cache first
    const cacheKey = `courses:list:${JSON.stringify(query)}:${page}:${limit}`;
    const cachedResult = await redisService.get(cacheKey);

    if (cachedResult) {
      return NextResponse.json(JSON.parse(cachedResult));
    }

    // Query database
    const skip = (page - 1) * limit;
    const [courses, totalCount] = await Promise.all([
      Course.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Course.countDocuments(query)
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
      }
    };

    // Cache result for 5 minutes
    await redisService.set(cacheKey, JSON.stringify(result), 300);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Course list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
