"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const RequiredField = () => (
  <span className="text-red-500 ml-1">*</span>
);

interface FormData {
  financialYear: number;
  totalElectricity: string;
  renewableElectricity: string;
  totalFuel: string;
  carbonEmissions: string;
  totalEmployees: string;
  femaleEmployees: string;
  trainingHours: string;
  communityInvestment: string;
  independentBoard: string;
  dataPrivacyPolicy: boolean | null;
  totalRevenue: string;
}

export default function ESGFormPage() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState<FormData>({
    financialYear: currentYear,
    totalElectricity: "",
    renewableElectricity: "",
    totalFuel: "",
    carbonEmissions: "",
    totalEmployees: "",
    femaleEmployees: "",
    trainingHours: "",
    communityInvestment: "",
    independentBoard: "",
    dataPrivacyPolicy: null,
    totalRevenue: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Auto-calculated metrics
  const [calculations, setCalculations] = useState({
    carbonIntensity: 0,
    renewableRatio: 0,
    diversityRatio: 0,
    communitySpendRatio: 0,
  });

  // Calculate metrics in real-time
  useEffect(() => {
    const carbonEmissions = parseFloat(formData.carbonEmissions) || 0;
    const totalRevenue = parseFloat(formData.totalRevenue) || 0;
    const renewableElectricity = parseFloat(formData.renewableElectricity) || 0;
    const totalElectricity = parseFloat(formData.totalElectricity) || 0;
    const femaleEmployees = parseInt(formData.femaleEmployees) || 0;
    const totalEmployees = parseInt(formData.totalEmployees) || 0;
    const communityInvestment = parseFloat(formData.communityInvestment) || 0;

    setCalculations({
      carbonIntensity: totalRevenue > 0 ? carbonEmissions / totalRevenue : 0,
      renewableRatio: totalElectricity > 0 ? (renewableElectricity / totalElectricity) * 100 : 0,
      diversityRatio: totalEmployees > 0 ? (femaleEmployees / totalEmployees) * 100 : 0,
      communitySpendRatio: totalRevenue > 0 ? (communityInvestment / totalRevenue) * 100 : 0,
    });
  }, [formData]);

  const handleInputChange = (field: keyof FormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Required fields validation
      const requiredFields = [
        { field: 'totalElectricity', label: 'Total Electricity Consumption' },
        { field: 'renewableElectricity', label: 'Renewable Electricity Consumption' },
        { field: 'totalFuel', label: 'Total Fuel Consumption' },
        { field: 'carbonEmissions', label: 'Carbon Emissions' },
        { field: 'totalEmployees', label: 'Total Number of Employees' },
        { field: 'femaleEmployees', label: 'Number of Female Employees' },
        { field: 'trainingHours', label: 'Average Training Hours' },
        { field: 'communityInvestment', label: 'Community Investment' },
        { field: 'independentBoard', label: '% of Independent Board Members' },
        { field: 'totalRevenue', label: 'Total Revenue' }
      ];

      const emptyFields = requiredFields.filter(
        ({ field }) => !formData[field as keyof FormData]
      );

      if (emptyFields.length > 0) {
        const fieldLabels = emptyFields.map(f => `"${f.label}"`).join(', ');
        const message = emptyFields.length === 1 
          ? `Please fill in the required field: ${fieldLabels}`
          : `Please fill in all required fields: ${fieldLabels}`;
        
        throw new Error(message);
      }

      // Numeric validation
      if (parseFloat(formData.renewableElectricity) > parseFloat(formData.totalElectricity)) {
        throw new Error("Renewable electricity cannot exceed total electricity consumption");
      }

      if (parseInt(formData.femaleEmployees) > parseInt(formData.totalEmployees)) {
        throw new Error("Female employees cannot exceed total employees");
      }

      const payload = {
        financialYear: formData.financialYear,
        totalElectricity: formData.totalElectricity ? parseFloat(formData.totalElectricity) : 0,
        renewableElectricity: formData.renewableElectricity ? parseFloat(formData.renewableElectricity) : 0,
        totalFuel: formData.totalFuel ? parseFloat(formData.totalFuel) : 0,
        carbonEmissions: formData.carbonEmissions ? parseFloat(formData.carbonEmissions) : 0,
        totalEmployees: formData.totalEmployees ? parseInt(formData.totalEmployees) : 0,
        femaleEmployees: formData.femaleEmployees ? parseInt(formData.femaleEmployees) : 0,
        trainingHours: formData.trainingHours ? parseFloat(formData.trainingHours) : 0,
        communityInvestment: formData.communityInvestment ? parseFloat(formData.communityInvestment) : 0,
        independentBoard: formData.independentBoard ? parseFloat(formData.independentBoard) : 0,
        dataPrivacyPolicy: formData.dataPrivacyPolicy,
        totalRevenue: formData.totalRevenue ? parseFloat(formData.totalRevenue) : 0,
        // Auto-calculated fields
        carbonIntensity: calculations.carbonIntensity,
        renewableRatio: calculations.renewableRatio,
        diversityRatio: calculations.diversityRatio,
        communitySpendRatio: calculations.communitySpendRatio,
      };

      const response = await fetch("/api/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save response");
      }

      setSuccess("ESG response saved successfully!");
      
      // Navigate to dashboard reports page after a short delay
      setTimeout(() => {
        router.push('/dashboard/reports');
      }, 1500);
      
      // Reset form after successful submission
      setFormData({
        financialYear: currentYear,
        totalElectricity: "",
        renewableElectricity: "",
        totalFuel: "",
        carbonEmissions: "",
        totalEmployees: "",
        femaleEmployees: "",
        trainingHours: "",
        communityInvestment: "",
        independentBoard: "",
        dataPrivacyPolicy: null,
        totalRevenue: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save response");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-teal-600 mb-3">ESG Questionnaire</h1>
          <p className="text-gray-600 text-lg">
            Complete your Environmental, Social, and Governance metrics for the selected financial year.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Financial Year Selection */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Reporting Period</CardTitle>
              <CardDescription>Select the financial year for this ESG report</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-w-xs">
                <Label htmlFor="financialYear" className="text-sm font-medium">Financial Year</Label>
                <Select
                  value={formData.financialYear.toString()}
                  onValueChange={(value) => handleInputChange("financialYear", parseInt(value))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => currentYear - i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Environmental Metrics */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                Environmental Metrics
              </CardTitle>
              <CardDescription>Track your organization&apos;s environmental impact</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="totalElectricity" className="text-sm font-medium flex items-center">
                    Total Electricity Consumption <RequiredField />
                  </Label>
                  <div className="relative">
                    <Input
                      id="totalElectricity"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.totalElectricity}
                      onChange={(e) => handleInputChange("totalElectricity", e.target.value)}
                      placeholder="0.00"
                      className={`pr-12 ${!formData.totalElectricity && error ? 'border-red-500' : ''}`}
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">kWh</span>
                    </div>
                  </div>
                  {!formData.totalElectricity && error && (
                    <p className="text-red-500 text-xs mt-1">This field is required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="renewableElectricity" className="text-sm font-medium flex items-center">
                    Renewable Electricity Consumption <RequiredField />
                  </Label>
                  <div className="relative">
                    <Input
                      id="renewableElectricity"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.renewableElectricity}
                      onChange={(e) => handleInputChange("renewableElectricity", e.target.value)}
                      placeholder="0.00"
                      className={`pr-12 ${!formData.renewableElectricity && error ? 'border-red-500' : ''}`}
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">kWh</span>
                    </div>
                  </div>
                  {!formData.renewableElectricity && error && (
                    <p className="text-red-500 text-xs mt-1">This field is required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalFuel" className="text-sm font-medium flex items-center">
                    Total Fuel Consumption <RequiredField />
                  </Label>
                  <div className="relative">
                    <Input
                      id="totalFuel"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.totalFuel}
                      onChange={(e) => handleInputChange("totalFuel", e.target.value)}
                      placeholder="0.00"
                      className={`pr-16 ${!formData.totalFuel && error ? 'border-red-500' : ''}`}
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">liters</span>
                    </div>
                  </div>
                  {!formData.totalFuel && error && (
                    <p className="text-red-500 text-xs mt-1">This field is required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="carbonEmissions" className="text-sm font-medium flex items-center">
                    Carbon Emissions <RequiredField />
                  </Label>
                  <div className="relative">
                    <Input
                      id="carbonEmissions"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.carbonEmissions}
                      onChange={(e) => handleInputChange("carbonEmissions", e.target.value)}
                      placeholder="0.00"
                      className={`pr-20 ${!formData.carbonEmissions && error ? 'border-red-500' : ''}`}
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">T CO2e</span>
                    </div>
                  </div>
                  {!formData.carbonEmissions && error && (
                    <p className="text-red-500 text-xs mt-1">This field is required</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Metrics */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                Social Metrics
              </CardTitle>
              <CardDescription>Measure your organization&apos;s social impact and workforce diversity</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="totalEmployees" className="text-sm font-medium flex items-center">
                    Total Number of Employees <RequiredField />
                  </Label>
                  <Input
                    id="totalEmployees"
                    type="number"
                    min="0"
                    value={formData.totalEmployees}
                    onChange={(e) => handleInputChange("totalEmployees", e.target.value)}
                    placeholder="0"
                    className={` ${!formData.totalEmployees && error ? 'border-red-500' : ''}`}
                    required
                  />
                  {!formData.totalEmployees && error && (
                    <p className="text-red-500 text-xs mt-1">This field is required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="femaleEmployees" className="text-sm font-medium flex items-center">
                    Number of Female Employees <RequiredField />
                  </Label>
                  <Input
                    id="femaleEmployees"
                    type="number"
                    min="0"
                    value={formData.femaleEmployees}
                    onChange={(e) => handleInputChange("femaleEmployees", e.target.value)}
                    placeholder="0"
                    className={` ${!formData.femaleEmployees && error ? 'border-red-500' : ''}`}
                    required
                  />
                  {!formData.femaleEmployees && error && (
                    <p className="text-red-500 text-xs mt-1">This field is required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trainingHours" className="text-sm font-medium flex items-center">
                    Average Training Hours <RequiredField />
                  </Label>
                  <Input
                    id="trainingHours"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.trainingHours}
                    onChange={(e) => handleInputChange("trainingHours", e.target.value)}
                    placeholder="0.0"
                    className={` ${!formData.trainingHours && error ? 'border-red-500' : ''}`}
                    required
                  />
                  {!formData.trainingHours && error && (
                    <p className="text-red-500 text-xs mt-1">This field is required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="communityInvestment" className="text-sm font-medium flex items-center">
                    Community Investment <RequiredField />
                  </Label>
                  <div className="relative">
                    <Input
                      id="communityInvestment"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.communityInvestment}
                      onChange={(e) => handleInputChange("communityInvestment", e.target.value)}
                      placeholder="0.00"
                      className={`pr-12 ${!formData.communityInvestment && error ? 'border-red-500' : ''}`}
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">INR</span>
                    </div>
                  </div>
                  {!formData.communityInvestment && error && (
                    <p className="text-red-500 text-xs mt-1">This field is required</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Governance Metrics */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                Governance Metrics
              </CardTitle>
              <CardDescription>Assess your organization&apos;s governance practices and transparency</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="independentBoard" className="text-sm font-medium flex items-center">
                    % of Independent Board Members <RequiredField />
                  </Label>
                  <div className="relative">
                    <Input
                      id="independentBoard"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.independentBoard}
                      onChange={(e) => handleInputChange("independentBoard", e.target.value)}
                      placeholder="0.0"
                      className={`pr-10 ${!formData.independentBoard && error ? 'border-red-500' : ''}`}
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">%</span>
                    </div>
                  </div>
                  {!formData.independentBoard && error && (
                    <p className="text-red-500 text-xs mt-1">This field is required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataPrivacyPolicy" className="text-sm font-medium">Does the company have a data privacy policy?</Label>
                  <Select
                    value={formData.dataPrivacyPolicy === null ? "" : formData.dataPrivacyPolicy.toString()}
                    onValueChange={(value) => handleInputChange("dataPrivacyPolicy", value === "true")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="totalRevenue" className="text-sm font-medium flex items-center">
                    Total Revenue <RequiredField />
                  </Label>
                  <div className="relative max-w-md">
                    <Input
                      id="totalRevenue"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.totalRevenue}
                      onChange={(e) => handleInputChange("totalRevenue", e.target.value)}
                      placeholder="0.00"
                      className={`pr-12 ${!formData.totalRevenue && error ? 'border-red-500' : ''}`}
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">INR</span>
                    </div>
                  </div>
                  {!formData.totalRevenue && error && (
                    <p className="text-red-500 text-xs mt-1">This field is required</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auto-Calculated Metrics */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                Auto-Calculated Metrics
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">Real-time calculation</Badge>
              </CardTitle>
              <CardDescription>These metrics are automatically calculated based on your inputs</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Carbon Intensity</Label>
                  <div className="relative">
                    <div className="flex items-center justify-between rounded-md border border-input bg-gray-100 px-3 py-2 text-sm">
                      <span>{calculations.carbonIntensity.toFixed(6)}</span>
                      <span className="text-xs text-gray-500">T CO2e / INR</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Renewable Electricity Ratio</Label>
                  <div className="relative">
                    <div className="flex items-center justify-between rounded-md border border-input bg-gray-100 px-3 py-2 text-sm">
                      <span>{calculations.renewableRatio.toFixed(2)}</span>
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Diversity Ratio</Label>
                  <div className="relative">
                    <div className="flex items-center justify-between rounded-md border border-input bg-gray-100 px-3 py-2 text-sm">
                      <span>{calculations.diversityRatio.toFixed(2)}</span>
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Community Spend Ratio</Label>
                  <div className="relative">
                    <div className="flex items-center justify-between rounded-md border border-input bg-gray-100 px-3 py-2 text-sm">
                      <span>{calculations.communitySpendRatio.toFixed(4)}</span>
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? "Saving..." : "Save ESG Response"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}