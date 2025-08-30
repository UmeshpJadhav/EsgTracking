import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home - ESG Tracker",
  description: "Welcome to your ESG reporting dashboard",
};

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const [user, responses] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    }),
    prisma.eSGResponse.findMany({
      where: { userId: session.user.id },
      orderBy: { financialYear: 'desc' },
      take: 5,
    }),
  ]);

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="flex justify-center items-center  px-4 sm:px-6 lg:px-8 py-8">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col items-center">
          <Card className="w-full max-w-5xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Welcome back, {user.name}!</CardTitle>
                <Button asChild>
                  <Link href="/dashboard/esg-form">New ESG Report</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Manage your ESG reporting and track your sustainability metrics.
              </p>
              
              {responses.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="font-medium">Recent Reports</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Financial Year
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Carbon Intensity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Community Spend Ratio
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Updated
                          </th>
                          <th className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {responses.map((response) => (
                          <tr key={response.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {response.financialYear}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {response.carbonIntensity?.toFixed(6) ?? 'N/A'} T CO2e/INR
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {response.communitySpendRatio ? (response.communitySpendRatio * 100).toFixed(4) + '%' : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {format(new Date(response.updatedAt), 'MMM d, yyyy hh:mm a')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link 
                                href={`/dashboard/esg-form?year=${response.financialYear}`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Edit
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {responses.length >= 5 && (
                    <div className="text-right">
                      <Link href="/dashboard/reports" className="text-sm text-indigo-600 hover:text-indigo-900">
                        View all reports →
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to your ESG Home!</h3>
                  <p className="text-sm text-gray-500 mb-4">Get started by creating your first ESG report</p>
                  <Button asChild>
                    <Link href="/dashboard/esg-form">Create Report</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
