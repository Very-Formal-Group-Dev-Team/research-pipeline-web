import { NextRequest, NextResponse } from 'next/server';

/**
 * Project join route (demo stub).
 * Returns a mock success response.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({
    message: 'Successfully joined project',
    project: {
      id: 'mock-project-001',
      title: 'Mock Research Project',
      project_code: body.projectCode || 'DEMO-001',
    },
  });
}
