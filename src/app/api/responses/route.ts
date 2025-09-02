import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

type ResponseData = {
  data?: any;
  error?: string;
};

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAuth();
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year');

    const whereClause: any = { 
      userId: user.id, 
      isDeleted: false 
    };

    if (year) {
      whereClause.financialYear = parseInt(year, 10);
    }

    const responses = await prisma.eSGResponse.findMany({
      where: whereClause,
      orderBy: { financialYear: "desc" },
    });

    return NextResponse.json<ResponseData>({ data: responses });
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json<ResponseData>(
      { error: 'Failed to fetch responses' },
      { status: error instanceof Error ? 401 : 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuth();
    const body = await req.json();

    // Input validation
    const requiredFields = ['financialYear'];
    const missingFields = requiredFields.filter(field => !(field in body));
    
    if (missingFields.length > 0) {
      return NextResponse.json<ResponseData>(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Calculate metrics
    const { 
      financialYear,
      totalElectricity = 0,
      renewableElectricity = 0,
      totalFuel = 0,
      carbonEmissions = 0,
      totalEmployees = 0,
      femaleEmployees = 0,
      trainingHours = 0,
      communityInvestment = 0,
      independentBoard = 0,
      dataPrivacyPolicy = false,
      totalRevenue = 0,
    } = body;

    // Create or update the response
    const response = await prisma.eSGResponse.upsert({
      where: {
        user_financial_year: {
          userId: user.id,
          financialYear,
        },
      },
      create: {
        userId: user.id,
        financialYear,
        totalElectricity,
        renewableElectricity,
        totalFuel,
        carbonEmissions,
        totalEmployees,
        femaleEmployees,
        trainingHours,
        communityInvestment,
        independentBoard,
        dataPrivacyPolicy,
        totalRevenue,
        carbonIntensity: totalRevenue ? carbonEmissions / totalRevenue : 0,
        renewableRatio: totalElectricity ? renewableElectricity / totalElectricity : 0,
        diversityRatio: totalEmployees ? femaleEmployees / totalEmployees : 0,
        communitySpendRatio: totalRevenue ? communityInvestment / totalRevenue : 0,
      },
      update: {
        totalElectricity,
        renewableElectricity,
        totalFuel,
        carbonEmissions,
        totalEmployees,
        femaleEmployees,
        trainingHours,
        communityInvestment,
        independentBoard,
        dataPrivacyPolicy,
        totalRevenue,
        carbonIntensity: totalRevenue ? carbonEmissions / totalRevenue : 0,
        renewableRatio: totalElectricity ? renewableElectricity / totalElectricity : 0,
        diversityRatio: totalEmployees ? femaleEmployees / totalEmployees : 0,
        communitySpendRatio: totalRevenue ? communityInvestment / totalRevenue : 0,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json<ResponseData>({ data: response }, { status: 201 });
  } catch (error) {
    console.error('Error saving response:', error);
    return NextResponse.json<ResponseData>(
      { error: 'Failed to save response' },
      { status: error instanceof Error ? 401 : 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user } = await requireAuth();
    const { searchParams } = new URL(req.url);
    const responseId = searchParams.get('id');

    if (!responseId) {
      return NextResponse.json<ResponseData>(
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
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    if (response.count === 0) {
      return NextResponse.json<ResponseData>(
        { error: 'Response not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ResponseData>({ data: { success: true } });
  } catch (error) {
    console.error('Error deleting response:', error);
    return NextResponse.json<ResponseData>(
      { error: 'Failed to delete response' },
      { status: error instanceof Error ? 401 : 500 }
    );
  }
}
