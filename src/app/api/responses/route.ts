import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const responses = await prisma.eSGResponse.findMany({
    where: { userId: session.user.id, isDeleted: false },
    orderBy: { financialYear: "desc" },
  });

  return NextResponse.json({ data: responses });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
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
  } = body || {};

  if (typeof financialYear !== 'number' || !Number.isInteger(financialYear)) {
    return NextResponse.json({ error: "Invalid or missing financialYear" }, { status: 400 });
  }

  const calculate = (numerator?: number | null, denominator?: number | null) => {
    if (!numerator || !denominator || denominator === 0) return 0;
    return Number(((numerator / denominator) * 100).toFixed(2));
  };

  const carbonIntensity = !totalRevenue || totalRevenue === 0
    ? 0
    : Number(((carbonEmissions || 0) / totalRevenue).toFixed(6));

  const renewableRatio = calculate(renewableElectricity, totalElectricity);
  const diversityRatio = calculate(femaleEmployees, totalEmployees);
  const communitySpendRatio = calculate(communityInvestment, totalRevenue);

  try {
    const response = await prisma.eSGResponse.upsert({
      where: {
        user_financial_year: { // Corrected from userId_financialYear based on lint context
          userId: session.user.id,
          financialYear,
        },
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
        carbonIntensity,
        renewableRatio,
        diversityRatio,
        communitySpendRatio,
      },
      create: {
        userId: session.user.id,
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
        carbonIntensity,
        renewableRatio,
        diversityRatio,
        communitySpendRatio,
      },
    });
    return NextResponse.json({ data: response }, { status: 201 });
  } catch (e: unknown) {
    let message = "Failed to save response";
    if (e instanceof Error) {
      message = e.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


