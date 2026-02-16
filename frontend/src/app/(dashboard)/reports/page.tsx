/**
 * Reports page for generating and downloading PDF reports
 */

"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { FileText, Download, Calendar, Loader2, TrendingUp, DollarSign, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

export default function ReportsPage() {
  const { toast } = useToast()
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reportType, setReportType] = useState<"income" | "expense" | "summary">("summary")

  // Fetch existing reports
  const {
    data: reportsData,
    isLoading: isLoadingReports,
    refetch: refetchReports,
  } = useQuery({
    queryKey: ["reports"],
    queryFn: () => apiClient.listReports(),
  })

  // Generate financial report
  const generateFinancialMutation = useMutation({
    mutationFn: () => apiClient.generateFinancialReport(startDate, endDate, reportType),
    onSuccess: (data) => {
      toast({
        title: "Report Generated",
        description: `Your ${reportType} report has been generated successfully.`,
      })
      refetchReports()
      // Auto download
      window.open(data.download_url, "_blank")
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Generate payroll report
  const generatePayrollMutation = useMutation({
    mutationFn: () => apiClient.generatePayrollReport(startDate, endDate),
    onSuccess: (data) => {
      toast({
        title: "Payroll Report Generated",
        description: "Your payroll report has been generated successfully.",
      })
      refetchReports()
      // Auto download
      window.open(data.download_url, "_blank")
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Download existing report
  const downloadReport = async (fileKey: string) => {
    try {
      const data = await apiClient.getReportDownloadUrl(fileKey)
      window.open(data.download_url, "_blank")
    } catch (error) {
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download report",
        variant: "destructive",
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const isDateRangeValid = startDate && endDate && new Date(startDate) <= new Date(endDate)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Generate and download financial, payroll, and operational reports
        </p>
      </div>

      {/* Report generators */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Financial Report Generator */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>Financial Report</CardTitle>
                <CardDescription>Generate income statement or expense report</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="financial-start">Start Date</Label>
                <Input
                  id="financial-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="financial-end">End Date</Label>
                <Input
                  id="financial-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-type">Report Type</Label>
                <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                  <SelectTrigger id="report-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Financial Summary</SelectItem>
                    <SelectItem value="income">Income Statement</SelectItem>
                    <SelectItem value="expense">Expense Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={() => generateFinancialMutation.mutate()}
              disabled={!isDateRangeValid || generateFinancialMutation.isPending}
              className="w-full"
            >
              {generateFinancialMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Payroll Report Generator */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle>Payroll Report</CardTitle>
                <CardDescription>Generate payroll summary for a period</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="payroll-start">Period Start</Label>
                <Input
                  id="payroll-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payroll-end">Period End</Label>
                <Input
                  id="payroll-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={() => generatePayrollMutation.mutate()}
              disabled={!isDateRangeValid || generatePayrollMutation.isPending}
              className="w-full"
            >
              {generatePayrollMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              Admin and manager roles only
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Existing reports */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
          <CardDescription>Download previously generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingReports ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : reportsData && reportsData.reports.length > 0 ? (
            <div className="space-y-2">
              {reportsData.reports.map((report) => {
                const filename = report.Key.split("/").pop() || report.Key
                const date = new Date(report.LastModified)

                return (
                  <div
                    key={report.Key}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(report.Size)} •{" "}
                          {format(date, "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadReport(report.Key)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No reports yet</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Generate your first report using the forms above
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
