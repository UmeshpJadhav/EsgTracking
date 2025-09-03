"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface ReportData {
  id: string;
  financialYear: number;
  carbonIntensity: number | null;        // T CO2e / INR
  renewableRatio: number | null;         // stored as fraction (0..1)
  diversityRatio: number | null;         // stored as fraction (0..1)
  communitySpendRatio: number | null;    // stored as fraction (0..1)
  // Add all other fields from the form
  [key: string]: any;
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [isExporting, setExporting] = useState<"none" | "pdf" | "excel">("none");
  const [selectedResponse, setSelectedResponse] = useState<ReportData | null>(null);

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Always fetch all data
        const res = await fetch('/api/responses');
        if (!res.ok) throw new Error("Failed to load data");
        const json = await res.json();
        const responseData = Array.isArray(json.data) ? json.data : [];
        
        setData(responseData);
        
        // If a specific year is selected, find and set it
        if (selectedYear !== "all") {
          const selected = responseData.find((item: ReportData) => 
            item.financialYear.toString() === selectedYear
          );
          setSelectedResponse(selected || null);
        } else {
          setSelectedResponse(null);
        }
      } catch (e) {
        console.error("Error fetching data:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update selected response when year changes
  useEffect(() => {
    if (selectedYear === "all") {
      setSelectedResponse(null);
    } else {
      const selected = data.find((item: ReportData) => 
        item.financialYear.toString() === selectedYear
      );
      setSelectedResponse(selected || null);
    }
  }, [selectedYear, data]);

  const years = useMemo(() => {
    const unique = new Set<number>();
    data.forEach(item => unique.add(item.financialYear));
    return Array.from(unique).sort((a, b) => b - a);
  }, [data]);

  // Prepare chart data with proper filtering and highlighting
  const chartData = useMemo(() => {
    // If "All Years" is selected, show all data with highlighting
    if (selectedYear === "all") {
      return data.map(d => ({
        year: d.financialYear,
        'Carbon Intensity': d.carbonIntensity ?? 0,
        'Community %': d.communitySpendRatio ? d.communitySpendRatio * 100 : 0,
        'Diversity %': d.diversityRatio ? d.diversityRatio * 100 : 0,
        'Renewable %': d.renewableRatio ? d.renewableRatio * 100 : 0,
        isSelected: false // No year is selected in "All Years" view
      }));
    }
    
    // If a specific year is selected, show only that year's data
    const selectedData = data.find((item: ReportData) => item.financialYear.toString() === selectedYear);
    if (!selectedData) return [];
    
    return [{
      year: selectedData.financialYear,
      'Carbon Intensity': selectedData.carbonIntensity ?? 0,
      'Community %': selectedData.communitySpendRatio ? selectedData.communitySpendRatio * 100 : 0,
      'Diversity %': selectedData.diversityRatio ? selectedData.diversityRatio * 100 : 0,
      'Renewable %': selectedData.renewableRatio ? selectedData.renewableRatio * 100 : 0,
      isSelected: true
    }];
  }, [data, selectedYear]);

  const exportToPDF = async () => {
    setExporting("pdf");
    try {
      const doc = new jsPDF();
      let yPosition = 20;
      
      // Add title and date
      doc.setFontSize(18);
      doc.text("ESG Performance Report", 14, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, yPosition);
      yPosition += 20;

      // Filter data based on selected year
      const exportData = selectedYear === "all" 
        ? data 
        : data.filter((item: ReportData) => item.financialYear.toString() === selectedYear);

      // Add summary table
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Summary Metrics", 14, yPosition);
      yPosition += 10;

      const tableData = exportData.map(d => [
        d.financialYear,
        d.carbonIntensity?.toFixed(6) ?? "N/A",
        d.renewableRatio ? (d.renewableRatio * 100).toFixed(2) + "%" : "N/A",
        d.diversityRatio ? (d.diversityRatio * 100).toFixed(2) + "%" : "N/A",
        d.communitySpendRatio ? (d.communitySpendRatio * 100).toFixed(2) + "%" : "N/A",
      ]);

      autoTable(doc, {
        head: [["Year", "Carbon Intensity (T CO2e/INR)", "Renewable %", "Diversity %", "Community %"]],
        body: tableData,
        startY: yPosition,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] },
      });

      // Add detailed report if a specific year is selected
      if (selectedYear !== "all" && exportData.length > 0) {
        const selectedData = exportData[0];
        // @ts-ignore - lastAutoTable is added by jspdf-autotable
        yPosition = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 15 : yPosition + 20;
        
        // Add detailed report header
        doc.setFontSize(14);
        doc.text(`Detailed Report - FY ${selectedYear}`, 14, yPosition);
        yPosition += 10;

        // Add detailed metrics in two columns
        const column1 = [
          { label: "Total Electricity (kWh)", value: formatNumber(selectedData.totalElectricity) },
          { label: "Renewable Electricity (kWh)", value: formatNumber(selectedData.renewableElectricity) },
          { label: "Total Fuel (liters)", value: formatNumber(selectedData.totalFuel) },
          { label: "Carbon Emissions (T CO2e)", value: formatNumber(selectedData.carbonEmissions) },
          { label: "Total Employees", value: formatNumber(selectedData.totalEmployees, 0) },
          { label: "Female Employees", value: formatNumber(selectedData.femaleEmployees, 0) },
        ];

        const column2 = [
          { label: "Independent Board (%)", value: `${formatNumber(selectedData.independentBoard)}%` },
          { label: "Data Privacy Policy", value: selectedData.dataPrivacyPolicy ? 'Yes' : 'No' },
          { label: "Total Revenue (INR)", value: formatNumber(selectedData.totalRevenue) },
          { label: "Carbon Intensity (T CO2e/INR)", value: formatNumber(selectedData.carbonIntensity, 6) },
          { label: "Renewable Energy Ratio", value: selectedData.renewableRatio ? (selectedData.renewableRatio * 100).toFixed(2) + '%' : 'N/A' },
        ];

        // Draw first column
        let currentY = yPosition + 10;
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text("Environmental & Social Metrics", 14, currentY);
        currentY += 5;
        doc.setFontSize(10);
        
        column1.forEach((item, index) => {
          doc.text(`${item.label}:`, 14, currentY + (index * 7));
          doc.text(item.value.toString(), 80, currentY + (index * 7));
        });

        // Draw second column
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text("Governance & Calculated Metrics", 105, currentY);
        currentY += 5;
        doc.setFontSize(10);
        
        column2.forEach((item, index) => {
          doc.text(`${item.label}:`, 105, currentY + (index * 7));
          doc.text(item.value.toString(), 170, currentY + (index * 7));
        });
      }

      doc.save(`esg-report-${selectedYear === "all" ? 'all-years' : `FY-${selectedYear}`}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting("none");
    }
  };

  const exportToExcel = () => {
    setExporting("excel");
    try {
      // Prepare data for Excel export
      let exportData;
      
      if (selectedYear === "all") {
        // For all years, just export the summary
        exportData = data.map(d => ({
          'Financial Year': d.financialYear,
          'Carbon Intensity (T CO2e/INR)': d.carbonIntensity?.toFixed(6) ?? "N/A",
          'Renewable Energy %': d.renewableRatio ? (d.renewableRatio * 100).toFixed(2) : "N/A",
          'Diversity %': d.diversityRatio ? (d.diversityRatio * 100).toFixed(2) : "N/A",
          'Community Spend %': d.communitySpendRatio ? (d.communitySpendRatio * 100).toFixed(2) : "N/A",
        }));
      } else {
        // For a specific year, include detailed data
        const selectedData = data.find((item: ReportData) => item.financialYear.toString() === selectedYear);
        if (selectedData) {
          exportData = [{
            // Summary
            'Financial Year': selectedData.financialYear,
            'Carbon Intensity (T CO2e/INR)': selectedData.carbonIntensity?.toFixed(6) ?? "N/A",
            'Renewable Energy %': selectedData.renewableRatio ? (selectedData.renewableRatio * 100).toFixed(2) : "N/A",
            'Diversity %': selectedData.diversityRatio ? (selectedData.diversityRatio * 100).toFixed(2) : "N/A",
            'Community Spend %': selectedData.communitySpendRatio ? (selectedData.communitySpendRatio * 100).toFixed(2) : "N/A",
            // Environmental
            'Total Electricity (kWh)': selectedData.totalElectricity,
            'Renewable Electricity (kWh)': selectedData.renewableElectricity,
            'Total Fuel (liters)': selectedData.totalFuel,
            'Carbon Emissions (T CO2e)': selectedData.carbonEmissions,
            // Social
            'Total Employees': selectedData.totalEmployees,
            'Female Employees': selectedData.femaleEmployees,
            // Governance
            'Independent Board %': selectedData.independentBoard,
            'Data Privacy Policy': selectedData.dataPrivacyPolicy ? 'Yes' : 'No',
            'Total Revenue (INR)': selectedData.totalRevenue,
          }];
        }
      }

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "ESG Report");
      
      // Save the file
      XLSX.writeFile(workbook, `esg-report-${selectedYear === "all" ? 'all-years' : `FY-${selectedYear}`}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting("none");
    }
  };

  const formatNumber = (value: number | null, decimals = 2) => {
    if (value === null) return "N/A";
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (data.length === 0) return <div className="p-6">No data available. Please submit your first ESG report.</div>;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {selectedYear === "all" ? "ESG Performance Dashboard" : `ESG Report - FY ${selectedYear}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {selectedYear === "all" 
              ? "Select a year to view detailed report"
              : "Detailed view of your submitted responses"}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <select
            aria-label="Select financial year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="p-2 border rounded text-sm w-full sm:w-auto"
          >
            <option value="all">All Years</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportToPDF}
            disabled={isExporting !== "none"}
            className="gap-2 flex-1 sm:flex-initial"
          >
            <Download className="h-4 w-4" />
            {isExporting === "pdf" ? "Exporting..." : "PDF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            disabled={isExporting !== "none"}
            className="gap-2 flex-1 sm:flex-initial"
          >
            <Download className="h-4 w-4" />
            {isExporting === "excel" ? "Exporting..." : "Excel"}
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>ESG Metrics Overview</CardTitle>
        </CardHeader>
        <CardContent className="h-[500px] p-0">
          <div className="h-full w-full p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ 
                  top: 20, 
                  right: 60,  
                  bottom: 20, 
                  left: 60    
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                
                {/* X-Axis */}
                <XAxis 
                  dataKey="year" 
                  tickLine={false}
                  axisLine={{ stroke: '#d1d5db' }}
                  tick={{ fill: '#4b5563' }}
                  tickMargin={10}
                />
                
                {/* Left Y-Axis (Percentage) */}
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  width={60}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#4b5563' }}
                  tickMargin={10}
                  domain={[0, 100]}
                  label={{
                    value: "Percentage (%)",
                    angle: -90,
                    position: 'insideLeft',
                    offset: -45,
                    style: {
                      textAnchor: 'middle',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      fill: '#4b5563'
                    }
                  }}
                  tickFormatter={(v) => `${v}%`}
                />

                {/* Right Y-Axis (Carbon Intensity) */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  width={80}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#4b5563' }}
                  tickMargin={10}
                  domain={[0, 'auto']}
                  label={{
                    value: "T CO2e/INR",
                    angle: 90,
                    position: 'insideRight',
                    offset: -50,
                    style: {
                      textAnchor: 'middle',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      fill: '#4b5563'
                    }
                  }}
                  tickFormatter={(v) => Number(v).toFixed(6)}
                />

                <Tooltip
                  formatter={(value: any, name: string) =>
                    name === "Carbon Intensity"
                      ? [Number(value).toFixed(6), name]
                      : [`${Number(value).toFixed(1)}%`, name]
                  }
                />
                
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                
                <Bar 
                  yAxisId="right" 
                  dataKey="Carbon Intensity" 
                  name="Carbon Intensity (T CO2e/INR)" 
                  fill="#3b82f6"
                  fillOpacity={({ payload }) => (payload.isSelected ? 1 : 0.6)}
                />
                <Bar 
                  yAxisId="left" 
                  dataKey="Community %" 
                  name="Community %" 
                  fill="#ef4444"
                  fillOpacity={({ payload }) => (payload.isSelected ? 1 : 0.6)}
                />
                <Bar 
                  yAxisId="left" 
                  dataKey="Diversity %" 
                  name="Diversity %" 
                  fill="#f59e0b"
                  fillOpacity={({ payload }) => (payload.isSelected ? 1 : 0.6)}
                />
                <Bar 
                  yAxisId="left" 
                  dataKey="Renewable %" 
                  name="Renewable %" 
                  fill="#10b981"
                  fillOpacity={({ payload }) => (payload.isSelected ? 1 : 0.6)}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed View Section - Only shown when a year is selected */}
      {selectedYear !== "all" && selectedResponse && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Detailed Report - FY {selectedYear}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Environmental Metrics Card */}
            <Card>
              <CardHeader className="pb-2">
                <h3 className="font-semibold">Environmental Metrics</h3>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Electricity (kWh):</span>
                  <span>{formatNumber(selectedResponse.totalElectricity)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Renewable Electricity (kWh):</span>
                  <span>{formatNumber(selectedResponse.renewableElectricity)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Fuel (liters):</span>
                  <span>{formatNumber(selectedResponse.totalFuel)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Carbon Emissions (T CO2e):</span>
                  <span>{formatNumber(selectedResponse.carbonEmissions)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Social Metrics Card */}
            <Card>
              <CardHeader className="pb-2">
                <h3 className="font-semibold">Social Metrics</h3>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Employees:</span>
                  <span>{formatNumber(selectedResponse.totalEmployees, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Female Employees:</span>
                  <span>{formatNumber(selectedResponse.femaleEmployees, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Training Hours:</span>
                  <span>{formatNumber(selectedResponse.trainingHours)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Community Investment (INR):</span>
                  <span>{formatNumber(selectedResponse.communityInvestment)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Governance & Calculated Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <h3 className="font-semibold">Governance Metrics</h3>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Independent Board (%):</span>
                  <span>{formatNumber(selectedResponse.independentBoard)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data Privacy Policy:</span>
                  <span>{selectedResponse.dataPrivacyPolicy ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Revenue (INR):</span>
                  <span>{formatNumber(selectedResponse.totalRevenue)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <h3 className="font-semibold">Calculated Metrics</h3>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Carbon Intensity (T CO2e/INR):</span>
                  <span>{formatNumber(selectedResponse.carbonIntensity, 6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Renewable Energy Ratio:</span>
                  <span>{formatNumber((selectedResponse.renewableRatio || 0) * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gender Diversity Ratio:</span>
                  <span>{formatNumber((selectedResponse.diversityRatio || 0) * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Community Spend Ratio:</span>
                  <span>{formatNumber((selectedResponse.communitySpendRatio || 0) * 100)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
