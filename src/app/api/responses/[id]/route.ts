import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth();
    const { id } = await params; // Must await params in Next.js 15
    const body: Omit<ESGResponseUpdate, 'userId'> = await request.json();

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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth();
    const { id } = await params; // Must await params in Next.js 15

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

    // Soft delete by marking as deleted
    await prisma.eSGResponse.update({
      where: { id },
      data: { isDeleted: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting response:', error);
    return NextResponse.json(
      { error: 'Failed to delete response' },
      { status: 500 }
    );
  }
}
