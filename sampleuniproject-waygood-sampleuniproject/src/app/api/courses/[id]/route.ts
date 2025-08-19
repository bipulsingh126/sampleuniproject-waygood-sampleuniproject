import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Course from '@/lib/models/Course';
import redisService from '@/lib/redis';
import { validateRequest, CourseUpdateSchema, createErrorResponse, createSuccessResponse } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const courseId = params.id;
    const cacheKey = `course:${courseId}`;

    // Check cache first
    const cachedCourse = await redisService.get(cacheKey);
    if (cachedCourse) {
      return NextResponse.json({
        ...JSON.parse(cachedCourse),
        cached: true
      });
    }

    // Fetch from database
    const course = await Course.findOne({ course_id: courseId }).lean();
    
    if (!course) {
      return NextResponse.json(
        createErrorResponse('Course not found', `No course found with ID: ${courseId}`),
        { status: 404 }
      );
    }

    const response = createSuccessResponse(course);
    
    // Cache for 30 minutes
    await redisService.set(cacheKey, JSON.stringify(response), 1800);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Course fetch error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to fetch course', error instanceof Error ? error.message : 'Unknown error'),
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = isAuthenticated(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        createErrorResponse('Unauthorized', 'Admin access required'),
        { status: 401 }
      );
    }

    await dbConnect();

    const courseId = params.id;
    const body = await request.json();

    // Validate input
    const validation = validateRequest(CourseUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Validation failed', validation.errors?.join(', ')),
        { status: 400 }
      );
    }

    // Update course
    const updatedCourse = await Course.findOneAndUpdate(
      { course_id: courseId },
      validation.data,
      { new: true, runValidators: true }
    );

    if (!updatedCourse) {
      return NextResponse.json(
        createErrorResponse('Course not found', `No course found with ID: ${courseId}`),
        { status: 404 }
      );
    }

    // Invalidate related caches
    await Promise.all([
      redisService.del(`course:${courseId}`),
      redisService.flushPattern('search:*'),
      redisService.flushPattern('courses:*')
    ]);

    return NextResponse.json(createSuccessResponse(updatedCourse, 'Course updated successfully'));

  } catch (error) {
    console.error('Course update error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to update course', error instanceof Error ? error.message : 'Unknown error'),
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = isAuthenticated(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        createErrorResponse('Unauthorized', 'Admin access required'),
        { status: 401 }
      );
    }

    await dbConnect();

    const courseId = params.id;
    const deletedCourse = await Course.findOneAndDelete({ course_id: courseId });

    if (!deletedCourse) {
      return NextResponse.json(
        createErrorResponse('Course not found', `No course found with ID: ${courseId}`),
        { status: 404 }
      );
    }

    // Invalidate related caches
    await Promise.all([
      redisService.del(`course:${courseId}`),
      redisService.flushPattern('search:*'),
      redisService.flushPattern('courses:*')
    ]);

    return NextResponse.json(createSuccessResponse(null, 'Course deleted successfully'));

  } catch (error) {
    console.error('Course delete error:', error);
    return NextResponse.json(
      createErrorResponse('Failed to delete course', error instanceof Error ? error.message : 'Unknown error'),
      { status: 500 }
    );
  }
}
