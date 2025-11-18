// Main export service orchestrator
import { ExportDataAggregator } from './data-aggregator';
import { PdfExporter } from './pdf-exporter';
import { ExcelExporter } from './excel-exporter';
import type { ExportFormat, ExportOptions } from '@/types/export';

export class ExportService {
  private dataAggregator: ExportDataAggregator;
  private pdfExporter: PdfExporter;
  private excelExporter: ExcelExporter;

  constructor() {
    this.dataAggregator = new ExportDataAggregator();
    this.pdfExporter = new PdfExporter();
    this.excelExporter = new ExcelExporter();
  }

  /**
   * Export matrix in specified format
   */
  async exportMatrix(
    matrixId: string,
    format: ExportFormat,
    options: Omit<ExportOptions, 'format'> = {}
  ): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    // Fetch and aggregate data
    const data = await this.dataAggregator.getMatrixExportData(matrixId, {
      includeComments: options.includeComments,
      includeAnalytics: options.includeAnalytics,
    });

    let buffer: Buffer;
    let mimeType: string;
    let extension: string;

    switch (format) {
      case 'pdf':
        buffer = await this.pdfExporter.generateMatrixPdf(data);
        mimeType = 'application/pdf';
        extension = 'pdf';
        break;

      case 'excel':
        buffer = this.excelExporter.generateMatrixExcel(data);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = 'xlsx';
        break;

      case 'csv':
        buffer = this.excelExporter.generateMatrixCsv(data);
        mimeType = 'text/csv';
        extension = 'csv';
        break;

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    // Generate filename
    const sanitizedName = data.matrix.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `raci_${sanitizedName}_${timestamp}.${extension}`;

    return { buffer, filename, mimeType };
  }

  /**
   * Export workload report
   */
  async exportWorkloadReport(
    organizationId: string,
    format: 'excel' | 'csv',
    dateRange?: { start: Date; end: Date }
  ): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    const report = await this.dataAggregator.generateWorkloadReport(organizationId, dateRange);

    let buffer: Buffer;
    let mimeType: string;
    let extension: string;

    if (format === 'excel') {
      buffer = this.excelExporter.generateWorkloadReportExcel(report);
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      extension = 'xlsx';
    } else {
      // Convert workload report to CSV
      const rows: string[][] = [
        ['Workload Report'],
        ['Member', 'Email', 'Department', 'Total', 'Responsible', 'Accountable', 'Consulted', 'Informed'],
      ];

      report.members.forEach((member) => {
        rows.push([
          member.name,
          member.email,
          member.department || 'N/A',
          member.totalAssignments.toString(),
          member.byRole.responsible.toString(),
          member.byRole.accountable.toString(),
          member.byRole.consulted.toString(),
          member.byRole.informed.toString(),
        ]);
      });

      const csvContent = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
      buffer = Buffer.from(csvContent, 'utf-8');
      mimeType = 'text/csv';
      extension = 'csv';
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `workload_report_${timestamp}.${extension}`;

    return { buffer, filename, mimeType };
  }
}

// Export singleton instance
export const exportService = new ExportService();

// Re-export types
export type { ExportFormat, ExportOptions, MatrixExportData, WorkloadReport } from '@/types/export';
