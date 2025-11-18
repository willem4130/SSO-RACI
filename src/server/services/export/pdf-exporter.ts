// PDF export service using pdfkit
import PDFDocument from 'pdfkit';
import type { MatrixExportData } from '@/types/export';

export class PdfExporter {
  /**
   * Generate PDF buffer from matrix data
   */
  async generateMatrixPdf(data: MatrixExportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'landscape',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Header
        this.renderHeader(doc, data);

        // Metadata section
        this.renderMetadata(doc, data);

        // RACI Matrix table
        this.renderRaciMatrix(doc, data);

        // Analytics section
        if (data.analytics) {
          doc.addPage();
          this.renderAnalytics(doc, data);
        }

        // Comments section
        if (data.comments && data.comments.length > 0) {
          doc.addPage();
          this.renderComments(doc, data);
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private renderHeader(doc: PDFKit.PDFDocument, data: MatrixExportData) {
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('RACI Matrix Report', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(16)
      .font('Helvetica')
      .text(data.matrix.name, { align: 'center' })
      .moveDown(1);
  }

  private renderMetadata(doc: PDFKit.PDFDocument, data: MatrixExportData) {
    doc.fontSize(10).font('Helvetica');

    const metadata = [
      ['Project:', data.matrix.project.name],
      ['Created by:', data.matrix.createdBy.name],
      ['Created:', data.matrix.createdAt.toLocaleDateString()],
      ['Last updated:', data.matrix.updatedAt.toLocaleDateString()],
      ['Version:', data.matrix.version.toString()],
      ['Total tasks:', data.tasks.length.toString()],
      ['Team members:', data.members.length.toString()],
    ];

    if (data.matrix.description) {
      metadata.push(['Description:', data.matrix.description || '']);
    }

    let yPosition = doc.y;
    metadata.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').text(label || '', 50, yPosition, { width: 120, continued: true });
      doc.font('Helvetica').text(value || '', { width: 400 });
      yPosition = doc.y;
    });

    doc.moveDown(1);
  }

  private renderRaciMatrix(doc: PDFKit.PDFDocument, data: MatrixExportData) {
    doc.fontSize(14).font('Helvetica-Bold').text('RACI Matrix').moveDown(0.5);

    const pageWidth = doc.page.width - 100; // Account for margins
    const taskColumnWidth = 200;
    const memberColumnWidth = (pageWidth - taskColumnWidth) / Math.min(data.members.length, 6);

    // Table header
    doc.fontSize(9).font('Helvetica-Bold');
    let xPosition = 50;
    let yPosition = doc.y;

    // Draw task header
    doc.rect(xPosition, yPosition, taskColumnWidth, 30).fillAndStroke('#4A5568', '#2D3748');
    doc.fillColor('#FFFFFF').text('Task', xPosition + 5, yPosition + 10, {
      width: taskColumnWidth - 10,
    });

    xPosition += taskColumnWidth;

    // Draw member headers (max 6 visible)
    const visibleMembers = data.members.slice(0, 6);
    visibleMembers.forEach((member) => {
      doc.rect(xPosition, yPosition, memberColumnWidth, 30).fillAndStroke('#4A5568', '#2D3748');
      doc.fillColor('#FFFFFF').text(member.name, xPosition + 5, yPosition + 10, {
        width: memberColumnWidth - 10,
        ellipsis: true,
      });
      xPosition += memberColumnWidth;
    });

    yPosition += 30;

    // Table rows
    doc.font('Helvetica').fontSize(8);
    data.tasks.forEach((task, index) => {
      // Check if we need a new page
      if (yPosition > doc.page.height - 100) {
        doc.addPage();
        yPosition = 50;
      }

      const rowColor = index % 2 === 0 ? '#F7FAFC' : '#FFFFFF';
      xPosition = 50;

      // Task name
      doc.rect(xPosition, yPosition, taskColumnWidth, 25).fillAndStroke(rowColor, '#E2E8F0');
      doc.fillColor('#000000').text(task.name, xPosition + 5, yPosition + 8, {
        width: taskColumnWidth - 10,
        ellipsis: true,
      });

      xPosition += taskColumnWidth;

      // RACI assignments for each member
      visibleMembers.forEach((member) => {
        const assignment = task.assignments.find(
          (a) => a.member.email === member.email
        );

        doc.rect(xPosition, yPosition, memberColumnWidth, 25).fillAndStroke(rowColor, '#E2E8F0');

        if (assignment) {
          const roleColors: Record<string, string> = {
            RESPONSIBLE: '#3B82F6',
            ACCOUNTABLE: '#10B981',
            CONSULTED: '#F59E0B',
            INFORMED: '#6B7280',
          };

          const role = assignment.raciRole;
          const color = roleColors[role] || '#6B7280';

          doc
            .fillColor(color)
            .font('Helvetica-Bold')
            .text(role[0] || '', xPosition + memberColumnWidth / 2 - 5, yPosition + 8);
        }

        xPosition += memberColumnWidth;
      });

      yPosition += 25;
    });

    // Legend
    doc.moveDown(2);
    doc.fontSize(10).font('Helvetica-Bold').text('Legend:').moveDown(0.5);
    doc.fontSize(8).font('Helvetica');

    const legend = [
      { letter: 'R', role: 'Responsible', color: '#3B82F6' },
      { letter: 'A', role: 'Accountable', color: '#10B981' },
      { letter: 'C', role: 'Consulted', color: '#F59E0B' },
      { letter: 'I', role: 'Informed', color: '#6B7280' },
    ];

    legend.forEach((item) => {
      doc.fillColor(item.color).text(item.letter, { continued: true });
      doc.fillColor('#000000').text(` - ${item.role}  `, { continued: true });
    });
  }

  private renderAnalytics(doc: PDFKit.PDFDocument, data: MatrixExportData) {
    if (!data.analytics) return;

    doc.fontSize(14).font('Helvetica-Bold').text('Analytics Report').moveDown(1);

    // Summary metrics
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total Tasks: ${data.analytics.totalTasks}`);
    doc.text(`Completed Tasks: ${data.analytics.completedTasks}`);
    doc.text(`Completion Rate: ${data.analytics.completionRate.toFixed(1)}%`);
    doc.moveDown(1);

    // Workload distribution
    doc.fontSize(12).font('Helvetica-Bold').text('Workload Distribution').moveDown(0.5);
    doc.fontSize(9).font('Helvetica');

    Object.entries(data.analytics.workloadDistribution).forEach(([email, workload]) => {
      doc.font('Helvetica-Bold').text(workload.name, { continued: true });
      doc
        .font('Helvetica')
        .text(
          ` - R: ${workload.responsible}, A: ${workload.accountable}, C: ${workload.consulted}, I: ${workload.informed} (Total: ${workload.total})`
        );
    });

    doc.moveDown(1);

    // Validation issues
    if (data.analytics.validationStatus.issues.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#EF4444').text('Validation Issues').moveDown(0.5);
      doc.fontSize(9).font('Helvetica').fillColor('#000000');

      data.analytics.validationStatus.issues.forEach((issue) => {
        doc.text(`• ${issue.taskName}: ${issue.message}`);
      });
    } else {
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#10B981').text('✓ All validation checks passed');
      doc.fillColor('#000000');
    }
  }

  private renderComments(doc: PDFKit.PDFDocument, data: MatrixExportData) {
    if (!data.comments) return;

    doc.fontSize(14).font('Helvetica-Bold').text('Comments & Discussions').moveDown(1);

    doc.fontSize(9).font('Helvetica');
    data.comments.forEach((comment) => {
      doc.font('Helvetica-Bold').text(comment.author.name, { continued: true });
      doc.font('Helvetica').text(` - ${comment.createdAt.toLocaleString()}`);
      doc.text(comment.content);
      doc.moveDown(0.5);
    });
  }
}
