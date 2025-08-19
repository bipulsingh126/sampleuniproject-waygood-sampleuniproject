import dbConnect from '@/lib/mongodb';
import Course, { ICourse, ICourseData } from '@/lib/models/Course';
import redisService from '@/lib/redis';

export interface CourseSearchOptions {
  query?: string;
  category?: string;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'all';
  minRating?: number;
  page?: number;
  limit?: number;
}
// Interface for search result
export interface CourseSearchResult {
  courses: ICourseData[];
  totalCount: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  cached: boolean;
}
// Class for course service
class CourseService {
  private readonly CACHE_TTL = {
    COURSE_DETAIL: 1800, // 30 minutes
    SEARCH_RESULTS: 600, // 10 minutes
    COURSE_LIST: 300     // 5 minutes
  };

  async searchCourses(options: CourseSearchOptions): Promise<CourseSearchResult> {
    await dbConnect();

    const {
      query = '',
      category,
      skillLevel,
      minRating,
      page = 1,
      limit = 20
    } = options;

    // Create cache key
    const cacheKey = `search:${JSON.stringify(options)}`;
    
    // Check cache first
    const cachedResult = await redisService.get(cacheKey);
    if (cachedResult) {
      return { ...JSON.parse(cachedResult), cached: true };
    }

    // Build MongoDB query
    const mongoQuery: any = {};

    if (query) {
      mongoQuery.$text = { $search: query };
    }

    if (category && category !== 'all') {
      mongoQuery.category = new RegExp(category, 'i');
    }

    if (skillLevel && skillLevel !== 'all') {
      mongoQuery.skill_level = skillLevel as 'beginner' | 'intermediate' | 'advanced';
    }

    if (minRating !== undefined) {
      mongoQuery.rating = { $gte: minRating };
    }

    // Execute search
    const skip = (page - 1) * limit;
    
    let sortCriteria: any;
    if (query) {
      sortCriteria = { score: { $meta: "textScore" as const }, rating: -1 };
    } else {
      sortCriteria = { rating: -1 };
    }

    const [courses, totalCount] = await Promise.all([
      Course.find(mongoQuery)
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .lean(),
      Course.countDocuments(mongoQuery)
    ]);

    const result: CourseSearchResult = {
      courses: courses as unknown as ICourseData[],
      totalCount,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      },
      cached: false
    };

    // Cache result
    await redisService.set(cacheKey, JSON.stringify(result), this.CACHE_TTL.SEARCH_RESULTS);

    return result;
  }

  async getCourseById(courseId: string): Promise<ICourseData | null> {
    await dbConnect();

    const cacheKey = `course:${courseId}`;
    
    // Check cache first
    const cachedCourse = await redisService.get(cacheKey);
    if (cachedCourse) {
      return JSON.parse(cachedCourse);
    }

    // Fetch from database
    const course = await Course.findOne({ course_id: courseId }).lean();
    
    if (course) {
      // Cache the result
      await redisService.set(cacheKey, JSON.stringify(course), this.CACHE_TTL.COURSE_DETAIL);
    }

    return course as ICourseData | null;
  }

  async createCourse(courseData: Partial<ICourse>): Promise<ICourse> {
    await dbConnect();

    const course = new Course(courseData);
    const savedCourse = await course.save();

    // Invalidate related caches
    await this.invalidateSearchCaches();

    return savedCourse;
  }

  async updateCourse(courseId: string, updateData: Partial<ICourse>): Promise<ICourse | null> {
    await dbConnect();

    const updatedCourse = await Course.findOneAndUpdate(
      { course_id: courseId },
      updateData,
      { new: true, runValidators: true }
    );

    if (updatedCourse) {
      // Invalidate related caches
      await Promise.all([
        redisService.del(`course:${courseId}`),
        this.invalidateSearchCaches()
      ]);
    }

    return updatedCourse;
  }

  async deleteCourse(courseId: string): Promise<boolean> {
    await dbConnect();

    const result = await Course.findOneAndDelete({ course_id: courseId });
    
    if (result) {
      // Invalidate related caches
      await Promise.all([
        redisService.del(`course:${courseId}`),
        this.invalidateSearchCaches()
      ]);
      return true;
    }

    return false;
  }

  async bulkInsertCourses(courses: Partial<ICourse>[]): Promise<{
    insertedCount: number;
    duplicateCount: number;
    errors: any[];
  }> {
    await dbConnect();

    let insertedCount = 0;
    let duplicateCount = 0;
    const errors: any[] = [];

    try {
      const result = await Course.insertMany(courses, { ordered: false });
      insertedCount = result.length;
    } catch (error: any) {
      if (error.code === 11000) {
        // Handle duplicate key errors
        const writeErrors = error.writeErrors || [];
        insertedCount = courses.length - writeErrors.length;
        duplicateCount = writeErrors.length;
        errors.push(...writeErrors);
      } else {
        throw error;
      }
    }

    // Invalidate all search caches after bulk insert
    await this.invalidateSearchCaches();

    return { insertedCount, duplicateCount, errors };
  }

  async getCourseStats(): Promise<{
    totalCourses: number;
    categoriesCount: Record<string, number>;
    skillLevelCount: Record<string, number>;
    averageRating: number;
  }> {
    await dbConnect();

    const cacheKey = 'course:stats';
    const cachedStats = await redisService.get(cacheKey);
    
    if (cachedStats) {
      return JSON.parse(cachedStats);
    }

    const [totalCourses, categoryStats, skillLevelStats, avgRating] = await Promise.all([
      Course.countDocuments(),
      Course.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      Course.aggregate([
        { $group: { _id: '$skill_level', count: { $sum: 1 } } }
      ]),
      Course.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ])
    ]);

    const stats = {
      totalCourses,
      categoriesCount: categoryStats.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      skillLevelCount: skillLevelStats.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      averageRating: avgRating[0]?.avgRating || 0
    };

    // Cache stats for 15 minutes
    await redisService.set(cacheKey, JSON.stringify(stats), 900);

    return stats;
  }

  private async invalidateSearchCaches(): Promise<void> {
    await Promise.all([
      redisService.flushPattern('search:*'),
      redisService.flushPattern('courses:*'),
      redisService.del('course:stats')
    ]);
  }
}

export default new CourseService();
