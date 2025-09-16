import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

type ResponseData = {
  data?: unknown;
  error?: string;
};

interface ResponseWhereClause {
  userId: string;
  isDeleted: boolean;
  financialYear?: number;
}

interface ESGResponseCreate {
  userId: string;
  financialYear: number;
  totalElectricity: number;
  renewableElectricity: number;
  totalFuel: number;
  carbonEmissions: number;
  totalEmployees: number;
  femaleEmployees: number;
  trainingHours: number;
  communityInvestment: number;
  independentBoard: number;
  dataPrivacyPolicy: boolean;
  totalRevenue: number;
  carbonIntensity: number;
  renewableRatio: number;
  diversityRatio: number;
  communitySpendRatio: number;
}

interface ESGResponseUpdate {
  totalElectricity: number;
  renewableElectricity: number;
  totalFuel: number;
  carbonEmissions: number;
  totalEmployees: number;
  femaleEmployees: number;
  trainingHours: number;
  communityInvestment: number;
  independentBoard: number;
  dataPrivacyPolicy: boolean;
  totalRevenue: number;
  carbonIntensity: number;
  renewableRatio: number;
  diversityRatio: number;
  communitySpendRatio: number;
  updatedAt: Date;
}

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAuth();
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year');

    const where: ResponseWhereClause = {
      userId: user.id,
      isDeleted: false,
    };

    if (year) {
      where.financialYear = parseInt(year, 10);
    }

    const responses = await prisma.eSGResponse.findMany({
      where,
      orderBy: {
        financialYear: 'desc',
      },
    });

    return NextResponse.json({ data: responses });
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuth();
    const body: Omit<ESGResponseCreate, 'userId'> = await req.json();

    // Check if response already exists for this year
    const existingResponse = await prisma.eSGResponse.findFirst({
      where: {
        userId: user.id,
        financialYear: body.financialYear,
        isDeleted: false,
      },
    });

    if (existingResponse) {
      return NextResponse.json(
        { error: 'Response already exists for this year' },
        { status: 400 }
      );
    }

    const response = await prisma.eSGResponse.create({
      data: {
        ...body,
        userId: user.id,
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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireAuth();
    const { id } = params;
    const body: Omit<ESGResponseUpdate, 'userId'> = await req.json();

    // Verify the response exists and belongs to the user
    const existingResponse = await prisma.eSGResponse.findFirst({
      where: {
        id,
        userId: user.id,
        isDeleted: false,
      },
    });

    if (!existingResponse) {
      return NextResponse.json(
        { error: 'Response not found or unauthorized' },
        { status: 404 }
      );
    }

    const updatedResponse = await prisma.eSGResponse.update({
      where: { id },
      data: {
        ...body,
        // Don't allow updating these fields
        id: undefined,
        userId: undefined,
        financialYear: undefined,
        createdAt: undefined,
      },
    });

    return NextResponse.json({ data: updatedResponse });
  } catch (error) {
    console.error('Error updating response:', error);
    return NextResponse.json(
      { error: 'Failed to update response' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user } = await requireAuth();
    const { searchParams } = new URL(req.url);
    const responseId = searchParams.get('id');

    if (!responseId) {
      return NextResponse.json(
        { error: 'Response ID is required' },
        { status: 400 }
      );
    }

    // Soft delete by marking as deleted
    const response = await prisma.eSGResponse.updateMany({
      where: {
        id: responseId,
        userId: user.id, // Ensure user can only delete their own responses
      },
      data: {
        isDeleted: true
      },
    });

    if (response.count === 0) {
      return NextResponse.json(
        { error: 'Response not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('Error deleting response:', error);
    return NextResponse.json(
      { error: 'Failed to delete response' },
      { status: 500 }
    );
  }
}
