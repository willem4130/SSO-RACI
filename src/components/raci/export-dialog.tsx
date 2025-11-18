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
import { Download, FileText, FileSpreadsheet, FileType, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExportDialogProps {
  matrixId: string;
  matrixName: string;
}

type ExportFormat = 'pdf' | 'excel' | 'csv';

export function ExportDialog({ matrixId, matrixName }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [includeComments, setIncludeComments] = useState(false);
  const [includeAnalytics, setIncludeAnalytics] = useState(true);

  const exportMutation = api.export.exportMatrix.useMutation({
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

      toast.success('Export completed', {
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

  const previewQuery = api.export.previewExportData.useQuery(
    {
      matrixId,
      includeComments,
      includeAnalytics,
    },
    {
      enabled: open,
    }
  );

  const handleExport = () => {
    exportMutation.mutate({
      matrixId,
      format: selectedFormat,
      includeComments,
      includeAnalytics,
    });
  };

  const formatOptions: Array<{
    value: ExportFormat;
    label: string;
    icon: typeof FileText;
    description: string;
  }> = [
    {
      value: 'pdf',
      label: 'PDF Report',
      icon: FileText,
      description: 'Formatted report with charts and tables',
    },
    {
      value: 'excel',
      label: 'Excel Workbook',
      icon: FileSpreadsheet,
      description: 'Multiple sheets with data and analytics',
    },
    {
      value: 'csv',
      label: 'CSV File',
      icon: FileType,
      description: 'Simple comma-separated values',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Matrix</DialogTitle>
          <DialogDescription>
            Export &quot;{matrixName}&quot; in your preferred format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <div className="grid gap-3">
              {formatOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setSelectedFormat(option.value)}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-colors text-left ${
                      selectedFormat === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>Include in Export</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAnalytics}
                  onChange={(e) => setIncludeAnalytics(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">
                  Analytics & validation (completion rate, workload distribution, issues)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeComments}
                  onChange={(e) => setIncludeComments(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">
                  Comments & discussions
                  {previewQuery.data?.commentCount !== undefined &&
                    ` (${previewQuery.data.commentCount})`}
                </span>
              </label>
            </div>
          </div>

          {/* Preview */}
          {previewQuery.data && (
            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <div className="font-medium">Export Preview</div>
              <div className="text-muted-foreground">
                • {previewQuery.data.taskCount} tasks
              </div>
              {previewQuery.data.willIncludeAnalytics && (
                <div className="text-muted-foreground">
                  • Analytics & validation report
                </div>
              )}
              {previewQuery.data.willIncludeComments && (
                <div className="text-muted-foreground">
                  • {previewQuery.data.commentCount} comments
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={exportMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exportMutation.isPending}>
            {exportMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
