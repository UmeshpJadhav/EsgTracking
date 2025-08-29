"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportData {
  id: string;
  financialYear: number;
  carbonIntensity: number | null;        // T CO2e / INR
  renewableRatio: number | null;         // stored as fraction (0..1)
  diversityRatio: number | null;         // stored as fraction (0..1)
  communitySpendRatio: number | null;    // stored as fraction (0..1)
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [isExporting, setExporting] = useState<"none" | "pdf" | "excel">("none");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/responses");
        if (!res.ok) throw new Error("Failed to load data");
        const json = await res.json();
        setData(Array.isArray(json.data) ? json.data : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const years = useMemo(() => {
    const unique = new Set<number>();
    data.forEach(d => unique.add(d.financialYear));
    return Array.from(unique).sort((a, b) => b - a);
  }, [data]);

  const filteredData = useMemo(() => {
    let result = [...data];
    if (selectedYear !== "all") {
      result = result.filter(d => d.financialYear === parseInt(selectedYear));
    }
    return result.sort((a, b) => a.financialYear - b.financialYear);
  }, [data, selectedYear]);

  // Prepare chart rows with correct units (percent metrics multiplied by 100)
  const chartData = useMemo(() => {
    return filteredData.map(d => ({
      year: d.financialYear,
      Carbon: d.carbonIntensity ?? 0,                                      // raw value
      Community: d.communitySpendRatio ? d.communitySpendRatio * 100 : 0,  // %
      Diversity: d.diversityRatio ? d.diversityRatio * 100 : 0,            // %
      Renewable: d.renewableRatio ? d.renewableRatio * 100 : 0,            // %
    }));
  }, [filteredData]);

  const exportToPDF = async () => {
    setExporting("pdf");
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("ESG Performance Summary", 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

      const tableData = filteredData.map(d => [
        d.financialYear,
        d.carbonIntensity?.toFixed(6) ?? "N/A",
        d.renewableRatio ? (d.renewableRatio * 100).toFixed(2) + "%" : "N/A",
        d.diversityRatio ? (d.diversityRatio * 100).toFixed(2) + "%" : "N/A",
        d.communitySpendRatio ? (d.communitySpendRatio * 100).toFixed(2) + "%" : "N/A",
      ]);

      autoTable(doc, {
        head: [["Year", "Carbon Intensity (T CO2e/INR)", "Renewable %", "Diversity %", "Community %"]],
        body: tableData,
        startY: 40,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] },
      });

      doc.save(`esg-summary-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting("none");
    }
  };

  const exportToExcel = () => {
    setExporting("excel");
    try {
      // Keep columns aligned with units (Carbon raw, others %)
      const worksheet = XLSX.utils.json_to_sheet(chartData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "ESG Summary");
      XLSX.writeFile(workbook, `esg-summary-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting("none");
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (data.length === 0) return <div className="p-6">No data available</div>;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">ESG Performance Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Summary of your organization&apos;s sustainability metrics
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
                  domain={[0, "auto"]}
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
                  domain={[0, "auto"]}
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
                
                <Bar yAxisId="right" dataKey="Carbon" name="Carbon Intensity" fill="#3b82f6" />
                <Bar yAxisId="left" dataKey="Community" name="Community %" fill="#ef4444" />
                <Bar yAxisId="left" dataKey="Diversity" name="Diversity %" fill="#f59e0b" />
                <Bar yAxisId="left" dataKey="Renewable" name="Renewable %" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
