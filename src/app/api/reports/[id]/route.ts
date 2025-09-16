import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';


export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const { user } = await requireAuth();

    const responses = await prisma.eSGResponse.findMany({
      where: {
        userId: user.id,
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ data: responses });
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/responses - Create a new ESG response
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { user } = await requireAuth();
    const body = await request.json();

    const {
      companyName,
      reportingPeriod,
      totalRevenue,
      carbonEmissions,
      renewableElectricity,
      totalElectricity,
      femaleEmployees,
      totalEmployees,
      communityInvestment,
      ...additionalData
    } = body;

    // Calculate derived metrics
    const carbonIntensity = carbonEmissions / (totalRevenue || 1);
    const renewableRatio = renewableElectricity / (totalElectricity || 1);
    const diversityRatio = femaleEmployees / (totalEmployees || 1);
    const communitySpendRatio = communityInvestment / (totalRevenue || 1);

    const response = await prisma.eSGResponse.create({
      data: {
        userId: user.id,
        companyName,
        reportingPeriod,
        totalRevenue,
        carbonEmissions,
        renewableElectricity,
        totalElectricity,
        femaleEmployees,
        totalEmployees,
        communityInvestment,
        carbonIntensity,
        renewableRatio,
        diversityRatio,
        communitySpendRatio,
        ...additionalData,
      },
    });

    return NextResponse.json({ data: response }, { status: 201 });
  } catch (error) {
    console.error('Error creating response:', error);
    return NextResponse.json(
      { error: 'Failed to create response' },
      { status: 500 }
    );
  }
}

// PUT /api/responses - Bulk update ESG responses
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const { user } = await requireAuth();
    const body = await request.json();
    const { ids, updateData } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs array is required' },
        { status: 400 }
      );
    }

    // Verify all reports belong to the user
    const reports = await prisma.eSGResponse.findMany({
      where: {
        id: { in: ids },
        userId: user.id,
        isDeleted: false,
      },
    });

    if (reports.length !== ids.length) {
      return NextResponse.json(
        { error: 'Some reports not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update all reports
    const updatedReports = await prisma.eSGResponse.updateMany({
      where: {
        id: { in: ids },
        userId: user.id,
      },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      data: { 
        updated: updatedReports.count,
        message: `Updated ${updatedReports.count} reports successfully`
      } 
    });
  } catch (error) {
    console.error('Error bulk updating responses:', error);
    return NextResponse.json(
      { error: 'Failed to update responses' },
      { status: 500 }
    );
  }
}

// DELETE /api/responses - Bulk soft delete ESG responses
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { user } = await requireAuth();
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs array is required' },
        { status: 400 }
      );
    }

    // Verify all reports belong to the user
    const reports = await prisma.eSGResponse.findMany({
      where: {
        id: { in: ids },
        userId: user.id,
        isDeleted: false,
      },
    });

    if (reports.length !== ids.length) {
      return NextResponse.json(
        { error: 'Some reports not found or unauthorized' },
        { status: 404 }
      );
    }

    // Soft delete all reports
    const deletedReports = await prisma.eSGResponse.updateMany({
      where: {
        id: { in: ids },
        userId: user.id,
      },
      data: {
        isDeleted: true,
      },
    });

    return NextResponse.json({ 
      data: { 
        deleted: deletedReports.count,
        message: `Deleted ${deletedReports.count} reports successfully`
      } 
    });
  } catch (error) {
    console.error('Error bulk deleting responses:', error);
    return NextResponse.json(
      { error: 'Failed to delete responses' },
      { status: 500 }
    );
  }
}