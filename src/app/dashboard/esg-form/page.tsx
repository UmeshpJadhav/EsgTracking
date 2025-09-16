"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const RequiredField = () => <span className="text-red-500 ml-1">*</span>;

const preventWheelChange = (e: React.WheelEvent<HTMLInputElement>) => {
  e.currentTarget.blur();
};
const preventArrowIncrement = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
};
const numberGuardProps = {
  onWheel: preventWheelChange,
  onKeyDown: preventArrowIncrement,
};

interface FormData {
  id?: number;
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

// Helper function to format financial year
const formatFinancialYear = (year: number) => {
  return `${year}-${(year + 1).toString().slice(-2)}`;
};

export default function ESGFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const yearParam = searchParams.get("year");
  const currentYear = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

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
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Auto-calculated metrics (store fractions 0..1; UI shows %)
  const [calculations, setCalculations] = useState({
    carbonIntensity: 0, // T CO2e / INR
    renewableRatio: 0, // fraction 0..1
    diversityRatio: 0, // fraction 0..1
    communitySpendRatio: 0, // fraction 0..1
  });

  // Reset form for new report
  const resetForm = (year: number) => {
    setFormData({
      financialYear: year,
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
    setError("");
    setSuccess("");
  };

  // Fetch existing data when year changes
  useEffect(() => {
    const fetchExistingData = async () => {
      if (!currentYear) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/responses?year=${currentYear}`);
        
        if (response.ok) {
          const { data } = await response.json();
          
          if (data && data.length > 0) {
            // Get the first (and should be only) report for this year
            const report = data[0];
            // Existing report found - populate form
            setFormData({
              id: report.id,
              financialYear: report.financialYear,
              totalElectricity: report.totalElectricity?.toString() || "",
              renewableElectricity: report.renewableElectricity?.toString() || "",
              totalFuel: report.totalFuel?.toString() || "",
              carbonEmissions: report.carbonEmissions?.toString() || "",
              totalEmployees: report.totalEmployees?.toString() || "",
              femaleEmployees: report.femaleEmployees?.toString() || "",
              trainingHours: report.trainingHours?.toString() || "",
              communityInvestment: report.communityInvestment?.toString() || "",
              independentBoard: report.independentBoard?.toString() || "",
              dataPrivacyPolicy: report.dataPrivacyPolicy,
              totalRevenue: report.totalRevenue?.toString() || "",
            });
            setSuccess(`Editing report for FY ${formatFinancialYear(currentYear)}`);
          } else {
            // No report exists for this year - reset form
            resetForm(currentYear);
            setSuccess(`Creating new report for FY ${formatFinancialYear(currentYear)}`);
          }
        } else {
          // If no report exists, reset the form for the current year
          resetForm(currentYear);
          setSuccess(`Creating new report for FY ${formatFinancialYear(currentYear)}`);
        }
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load report data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExistingData();
  }, [currentYear]);

  // Handle year change
  const handleYearChange = (year: number) => {
    router.push(`/dashboard/esg-form?year=${year}`);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const requiredFields = [
      'totalElectricity', 'renewableElectricity', 'totalFuel', 'carbonEmissions',
      'totalEmployees', 'femaleEmployees', 'trainingHours', 'communityInvestment',
      'independentBoard', 'totalRevenue'
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields`);
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const method = formData.id ? 'PUT' : 'POST';
      const url = formData.id ? `/api/responses/${formData.id}` : '/api/responses';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          financialYear: currentYear,
          totalElectricity: parseFloat(formData.totalElectricity) || 0,
          renewableElectricity: parseFloat(formData.renewableElectricity) || 0,
          totalFuel: parseFloat(formData.totalFuel) || 0,
          carbonEmissions: parseFloat(formData.carbonEmissions) || 0,
          totalEmployees: parseInt(formData.totalEmployees, 10) || 0,
          femaleEmployees: parseInt(formData.femaleEmployees, 10) || 0,
          trainingHours: parseFloat(formData.trainingHours) || 0,
          communityInvestment: parseFloat(formData.communityInvestment) || 0,
          independentBoard: parseFloat(formData.independentBoard) || 0,
          dataPrivacyPolicy: formData.dataPrivacyPolicy,
          totalRevenue: parseFloat(formData.totalRevenue) || 0,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save report');
      }

      setSuccess(`Report ${formData.id ? 'updated' : 'created'} successfully!`);
      setTimeout(() => router.push('/dashboard/reports'), 1500);
    } catch (error) {
      console.error('Error saving report:', error);
      setError(error instanceof Error ? error.message : 'Failed to save report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: typeof prev[field] === 'number' ? Number(value) : value
    }));
    setError("");
    setSuccess("");
  };

  // Recalculate on any input change
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
      renewableRatio: totalElectricity > 0 ? renewableElectricity / totalElectricity : 0,
      diversityRatio: totalEmployees > 0 ? femaleEmployees / totalEmployees : 0,
      communitySpendRatio: totalRevenue > 0 ? communityInvestment / totalRevenue : 0,
    });
  }, [formData]);

  return (
    <div className="min-h-screen bg-gray-50/90">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {formData.id ? 'Edit ESG Report' : 'New ESG Report'}
            </h1>
            <p className="text-muted-foreground">
              Financial Year: {formatFinancialYear(currentYear)}
              {formData.id ? ' • Click save to update your report' : ' • Fill in the details below to create a new report'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Select
              value={currentYear.toString()}
              onValueChange={(value) => handleYearChange(parseInt(value, 10))}
              disabled={isSubmitting}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {formatFinancialYear(year)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reporting Period */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Reporting Period</CardTitle>
              <CardDescription>
                Select the financial year for this ESG report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="financialYear" className="flex items-center">
                    Financial Year <RequiredField />
                  </Label>
                  <div className="text-lg font-medium p-2 bg-gray-50 rounded-md border">
                    {formatFinancialYear(currentYear)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Environmental Metrics */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">Environmental Metrics</CardTitle>
              <CardDescription>Track your organization&apos;s environmental impact</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Electricity */}
                <div className="space-y-2">
                  <Label htmlFor="totalElectricity" className="text-sm font-medium flex items-center">
                    Total Electricity Consumption <RequiredField />
                  </Label>
                  <div className="relative">
                    <Input
                      id="totalElectricity"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={formData.totalElectricity}
                      onChange={(e) => handleInputChange("totalElectricity", e.target.value)}
                      placeholder="0.00"
                      className={`pr-12 ${!formData.totalElectricity && error ? "border-red-500" : ""}`}
                      required
                      {...numberGuardProps}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">kWh</span>
                    </div>
                  </div>
                </div>

                {/* Renewable Electricity */}
                <div className="space-y-2">
                  <Label htmlFor="renewableElectricity" className="text-sm font-medium flex items-center">
                    Renewable Electricity Consumption <RequiredField />
                  </Label>
                  <div className="relative">
                    <Input
                      id="renewableElectricity"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={formData.renewableElectricity}
                      onChange={(e) => handleInputChange("renewableElectricity", e.target.value)}
                      placeholder="0.00"
                      className={`pr-12 ${!formData.renewableElectricity && error ? "border-red-500" : ""}`}
                      required
                      {...numberGuardProps}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">kWh</span>
                    </div>
                  </div>
                </div>

                {/* Total Fuel */}
                <div className="space-y-2">
                  <Label htmlFor="totalFuel" className="text-sm font-medium flex items-center">
                    Total Fuel Consumption <RequiredField />
                  </Label>
                  <div className="relative">
                    <Input
                      id="totalFuel"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={formData.totalFuel}
                      onChange={(e) => handleInputChange("totalFuel", e.target.value)}
                      placeholder="0.00"
                      className={`pr-16 ${!formData.totalFuel && error ? "border-red-500" : ""}`}
                      required
                      {...numberGuardProps}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">liters</span>
                    </div>
                  </div>
                </div>

                {/* Carbon Emissions */}
                <div className="space-y-2">
                  <Label htmlFor="carbonEmissions" className="text-sm font-medium flex items-center">
                    Carbon Emissions <RequiredField />
                  </Label>
                  <div className="relative">
                    <Input
                      id="carbonEmissions"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={formData.carbonEmissions}
                      onChange={(e) => handleInputChange("carbonEmissions", e.target.value)}
                      placeholder="0.00"
                      className={`pr-20 ${!formData.carbonEmissions && error ? "border-red-500" : ""}`}
                      required
                      {...numberGuardProps}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                        T CO2e
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Metrics */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">Social Metrics</CardTitle>
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
                    inputMode="numeric"
                    min="0"
                    value={formData.totalEmployees}
                    onChange={(e) => handleInputChange("totalEmployees", e.target.value)}
                    placeholder="0"
                    className={`${!formData.totalEmployees && error ? "border-red-500" : ""}`}
                    required
                    {...numberGuardProps}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="femaleEmployees" className="text-sm font-medium flex items-center">
                    Number of Female Employees <RequiredField />
                  </Label>
                  <Input
                    id="femaleEmployees"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={formData.femaleEmployees}
                    onChange={(e) => handleInputChange("femaleEmployees", e.target.value)}
                    placeholder="0"
                    className={`${!formData.femaleEmployees && error ? "border-red-500" : ""}`}
                    required
                    {...numberGuardProps}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trainingHours" className="text-sm font-medium flex items-center">
                    Average Training Hours <RequiredField />
                  </Label>
                  <Input
                    id="trainingHours"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    value={formData.trainingHours}
                    onChange={(e) => handleInputChange("trainingHours", e.target.value)}
                    placeholder="0.0"
                    className={`${!formData.trainingHours && error ? "border-red-500" : ""}`}
                    required
                    {...numberGuardProps}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="communityInvestment" className="text-sm font-medium flex items-center">
                    Community Investment <RequiredField />
                  </Label>
                  <div className="relative">
                    <Input
                      id="communityInvestment"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={formData.communityInvestment}
                      onChange={(e) => handleInputChange("communityInvestment", e.target.value)}
                      placeholder="0.00"
                      className={`pr-12 ${!formData.communityInvestment && error ? "border-red-500" : ""}`}
                      required
                      {...numberGuardProps}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">INR</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Governance Metrics */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">Governance Metrics</CardTitle>
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
                      inputMode="decimal"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.independentBoard}
                      onChange={(e) => handleInputChange("independentBoard", e.target.value)}
                      placeholder="0.0"
                      className={`pr-10 ${!formData.independentBoard && error ? "border-red-500" : ""}`}
                      required
                      {...numberGuardProps}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataPrivacyPolicy" className="text-sm font-medium">
                    Does the company have a data privacy policy?
                  </Label>
                  <Select
                    value={formData.dataPrivacyPolicy === null || formData.dataPrivacyPolicy === undefined 
                      ? "" 
                      : formData.dataPrivacyPolicy.toString()}
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
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={formData.totalRevenue}
                      onChange={(e) => handleInputChange("totalRevenue", e.target.value)}
                      placeholder="0.00"
                      className={`pr-12 ${!formData.totalRevenue && error ? "border-red-500" : ""}`}
                      required
                      {...numberGuardProps}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">INR</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auto-Calculated Metrics */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                Auto-Calculated Metrics
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                  Real-time calculation
                </Badge>
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
                      <span>{(calculations.renewableRatio * 100).toFixed(2)}</span>
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Diversity Ratio</Label>
                  <div className="relative">
                    <div className="flex items-center justify-between rounded-md border border-input bg-gray-100 px-3 py-2 text-sm">
                      <span>{(calculations.diversityRatio * 100).toFixed(2)}</span>
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Community Spend Ratio</Label>
                  <div className="relative">
                    <div className="flex items-center justify-between rounded-md border border-input bg-gray-100 px-3 py-2 text-sm">
                      <span>{(calculations.communitySpendRatio * 100).toFixed(4)}</span>
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={isLoading || isSubmitting}>
              {isLoading ? "Loading..." : isSubmitting ? "Saving..." : "Save ESG Response"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
