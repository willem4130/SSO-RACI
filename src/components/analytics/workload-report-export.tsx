'use client';

import { useState } from 'react';
import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Download, FileSpreadsheet, FileType, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface WorkloadReportExportProps {
  organizationId: string;
}

type ReportFormat = 'excel' | 'csv';

export function WorkloadReportExport({ organizationId }: WorkloadReportExportProps) {
  const [open, setOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>('excel');
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'quarter' | 'year'>('all');

  const exportMutation = api.export.exportWorkloadReport.useMutation({
    onSuccess: (data: { data: string; filename: string; mimeType: string }) => {
      // Convert base64 to blob and trigger download
      const binaryString = atob(data.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: data.mimeType });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Report generated', {
        description: `Downloaded ${data.filename}`,
      });
      setOpen(false);
    },
    onError: (error) => {
      toast.error('Export failed', {
        description: error.message,
      });
    },
  });

  const handleExport = () => {
    const now = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (dateRange !== 'all') {
      endDate = now;
      startDate = new Date(now);

      switch (dateRange) {
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
    }

    exportMutation.mutate({
      organizationId,
      format: selectedFormat,
      startDate,
      endDate,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Workload Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Workload Report</DialogTitle>
          <DialogDescription>
            Generate a comprehensive workload distribution report for your organization
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date Range Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Time Period
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'all', label: 'All Time' },
                { value: 'month', label: 'Last Month' },
                { value: 'quarter', label: 'Last Quarter' },
                { value: 'year', label: 'Last Year' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDateRange(option.value as typeof dateRange)}
                  className={`p-3 rounded-lg border-2 transition-colors font-medium ${
                    dateRange === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <div className="grid gap-2">
              <button
                onClick={() => setSelectedFormat('excel')}
                className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-colors text-left ${
                  selectedFormat === 'excel'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <FileSpreadsheet className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium">Excel Workbook</div>
                  <div className="text-sm text-muted-foreground">
                    Multiple sheets with summary, member workload, and matrix breakdown
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedFormat('csv')}
                className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-colors text-left ${
                  selectedFormat === 'csv'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <FileType className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium">CSV File</div>
                  <div className="text-sm text-muted-foreground">
                    Simple format for import into other tools
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Report Contents */}
          <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
            <div className="font-medium">Report Includes</div>
            <div className="text-muted-foreground">• Organization-wide workload summary</div>
            <div className="text-muted-foreground">• Per-member RACI assignment breakdown</div>
            <div className="text-muted-foreground">• Assignment distribution by matrix</div>
            <div className="text-muted-foreground">• Role distribution (R, A, C, I)</div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={exportMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exportMutation.isPending}>
            {exportMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
