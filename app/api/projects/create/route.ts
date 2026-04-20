import { NextResponse } from 'next/server';

/**
 * Project creation route (demo stub).
 * Returns a mock success response.
 */
export async function POST(request: Request) {
  return NextResponse.json({
    message: 'Project created successfully',
    project: {
      id: 'mock-new-project',
      title: 'New Project',
      project_code: 'NEW-001',
      status: 'pending',
    },
  });
}
