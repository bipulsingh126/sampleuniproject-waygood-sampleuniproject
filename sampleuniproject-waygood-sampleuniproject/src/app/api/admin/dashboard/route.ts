import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const payload = isAuthenticated(request);
    if (!payload) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!isAdmin(payload)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Return admin dashboard data
    return NextResponse.json(
      {
        message: 'Welcome to the admin dashboard!',
        admin: {
          id: payload.userId,
          email: payload.email,
          role: payload.role
        },
        dashboardData: {
          totalUsers: 1,
          totalCourses: 0,
          systemStatus: 'operational',
          lastLogin: new Date().toISOString()
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
