import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

type ResponseData = {
  data?: any;
  error?: string;
};

type RouteParams = {
  params: {
    id: string;
  };
};

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { user } = await requireAuth();
    const reportId = params.id;

    if (!reportId) {
      return NextResponse.json<ResponseData>(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    const report = await prisma.eSGResponse.findUnique({
      where: {
        id: reportId,
        userId: user.id,
      },
    });

    if (!report) {
      return NextResponse.json<ResponseData>(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Ensure the report belongs to the authenticated user
    if (report.userId !== user.id) {
      return NextResponse.json<ResponseData>(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json<ResponseData>({ data: report });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json<ResponseData>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireAuth();
    const reportId = params?.id;
    const body = await request.json();

    if (!reportId) {
      return NextResponse.json<ResponseData>(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // Check if report exists and belongs to user
    const existingReport = await prisma.eSGResponse.findUnique({
      where: { id: reportId },
    });

    if (!existingReport) {
      return NextResponse.json<ResponseData>(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    if (existingReport.userId !== user.id) {
      return NextResponse.json<ResponseData>(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Calculate metrics if relevant fields are updated
    const updateData = { ...body };
    const { totalRevenue, carbonEmissions, renewableElectricity, totalElectricity, femaleEmployees, totalEmployees, communityInvestment } = body;

    if (totalRevenue !== undefined) {
      updateData.carbonIntensity = carbonEmissions !== undefined 
        ? carbonEmissions / (totalRevenue || 1) 
        : existingReport.carbonEmissions / (totalRevenue || 1);
      
      updateData.communitySpendRatio = communityInvestment !== undefined
        ? communityInvestment / (totalRevenue || 1)
        : (existingReport.communityInvestment || 0) / (totalRevenue || 1);
    }

    if (totalElectricity !== undefined) {
      updateData.renewableRatio = renewableElectricity !== undefined
        ? renewableElectricity / (totalElectricity || 1)
        : (existingReport.renewableElectricity || 0) / (totalElectricity || 1);
    }

    if (totalEmployees !== undefined) {
      updateData.diversityRatio = femaleEmployees !== undefined
        ? femaleEmployees / (totalEmployees || 1)
        : (existingReport.femaleEmployees || 0) / (totalEmployees || 1);
    }

    // Update the report
    const updatedReport = await prisma.eSGResponse.update({
      where: { id: reportId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json<ResponseData>({ data: updatedReport });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json<ResponseData>(
      { error: 'Failed to update report' },
      { status: error instanceof Error ? 401 : 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireAuth();
    const reportId = params?.id;

    if (!reportId) {
      return NextResponse.json<ResponseData>(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // Check if report exists and belongs to user
    const existingReport = await prisma.eSGResponse.findUnique({
      where: { id: reportId },
    });

    if (!existingReport) {
      return NextResponse.json<ResponseData>(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    if (existingReport.userId !== user.id) {
      return NextResponse.json<ResponseData>(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Soft delete the report
    await prisma.eSGResponse.update({
      where: { id: reportId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json<ResponseData>({ data: { success: true } });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json<ResponseData>(
      { error: 'Failed to delete report' },
      { status: error instanceof Error ? 401 : 500 }
    );
  }
}
