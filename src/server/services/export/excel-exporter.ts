// Excel/CSV export service using xlsx
import * as XLSX from 'xlsx';
import type { MatrixExportData, WorkloadReport } from '@/types/export';

export class ExcelExporter {
  /**
   * Generate Excel buffer from matrix data
   */
  generateMatrixExcel(data: MatrixExportData): Buffer {
    const workbook = XLSX.utils.book_new();

    // Matrix overview sheet
    this.addMatrixSheet(workbook, data);

    // Task details sheet
    this.addTaskDetailsSheet(workbook, data);

    // Workload distribution sheet
    if (data.analytics) {
      this.addWorkloadSheet(workbook, data);
    }

    // Comments sheet
    if (data.comments && data.comments.length > 0) {
      this.addCommentsSheet(workbook, data);
    }

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Generate CSV buffer from matrix data
   */
  generateMatrixCsv(data: MatrixExportData): Buffer {
    const rows: string[][] = [];

    // Header row with metadata
    rows.push(['RACI Matrix Export']);
    rows.push(['Matrix Name:', data.matrix.name]);
    rows.push(['Project:', data.matrix.project.name]);
    rows.push(['Created by:', data.matrix.createdBy.name]);
    rows.push(['Created:', data.matrix.createdAt.toLocaleDateString()]);
    rows.push(['Last updated:', data.matrix.updatedAt.toLocaleDateString()]);
    rows.push([]); // Empty row

    // RACI matrix header
    const headerRow = ['Task'];
    data.members.forEach((member) => {
      headerRow.push(member.name);
    });
    rows.push(headerRow);

    // Task rows
    data.tasks.forEach((task) => {
      const row: string[] = [task.name];

      data.members.forEach((member) => {
        const assignment = task.assignments.find(
          (a) => a.member.email === member.email
        );
        row.push(assignment ? assignment.raciRole : '');
      });

      rows.push(row);
    });

    // Convert to CSV string
    const csvContent = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    return Buffer.from(csvContent, 'utf-8');
  }

  /**
   * Generate Excel workload report
   */
  generateWorkloadReportExcel(report: WorkloadReport): Buffer {
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Workload Report'],
      ['Organization ID:', report.organizationId],
      ['Date Range:', `${report.dateRange.start.toLocaleDateString()} - ${report.dateRange.end.toLocaleDateString()}`],
      [],
      ['Summary Statistics'],
      ['Total Members:', report.summary.totalMembers],
      ['Total Assignments:', report.summary.totalAssignments],
      ['Average Assignments per Member:', report.summary.averageAssignmentsPerMember.toFixed(2)],
      ['Most Loaded Member:', report.summary.mostLoadedMember.name],
      ['Their Assignment Count:', report.summary.mostLoadedMember.assignmentCount],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Member workload sheet
    const memberData: unknown[][] = [
      ['Member', 'Email', 'Department', 'Total Assignments', 'Responsible', 'Accountable', 'Consulted', 'Informed'],
    ];

    report.members.forEach((member) => {
      memberData.push([
        member.name,
        member.email,
        member.department || 'N/A',
        member.totalAssignments,
        member.byRole.responsible,
        member.byRole.accountable,
        member.byRole.consulted,
        member.byRole.informed,
      ]);
    });

    const memberSheet = XLSX.utils.aoa_to_sheet(memberData);
    XLSX.utils.book_append_sheet(workbook, memberSheet, 'Member Workload');

    // Matrix breakdown sheet
    const matrixData: unknown[][] = [['Member', 'Matrix', 'Project', 'Assignment Count']];

    report.members.forEach((member) => {
      member.byMatrix.forEach((matrix) => {
        matrixData.push([member.name, matrix.matrixName, matrix.projectName, matrix.assignmentCount]);
      });
    });

    const matrixSheet = XLSX.utils.aoa_to_sheet(matrixData);
    XLSX.utils.book_append_sheet(workbook, matrixSheet, 'Matrix Breakdown');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  private addMatrixSheet(workbook: XLSX.WorkBook, data: MatrixExportData) {
    const matrixData: unknown[][] = [
      ['Task'],
    ];

    // Add member names as column headers
    data.members.forEach((member) => {
      matrixData[0]?.push(member.name);
    });

    // Add task rows
    data.tasks.forEach((task) => {
      const row: unknown[] = [task.name];

      data.members.forEach((member) => {
        const assignment = task.assignments.find(
          (a) => a.member.email === member.email
        );
        row.push(assignment ? assignment.raciRole : '');
      });

      matrixData.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(matrixData);

    // Set column widths
    const colWidths = [{ wch: 30 }]; // Task column
    data.members.forEach(() => colWidths.push({ wch: 15 }));
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'RACI Matrix');
  }

  private addTaskDetailsSheet(workbook: XLSX.WorkBook, data: MatrixExportData) {
    const taskData: unknown[][] = [
      ['Task Name', 'Description', 'Status', 'Priority', 'Due Date', 'Assignments'],
    ];

    data.tasks.forEach((task) => {
      const assignmentSummary = task.assignments
        .map((a) => `${a.member.name} (${a.raciRole})`)
        .join('; ');

      taskData.push([
        task.name,
        task.description || '',
        task.status,
        task.priority,
        task.dueDate ? task.dueDate.toLocaleDateString() : '',
        assignmentSummary,
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(taskData);
    worksheet['!cols'] = [
      { wch: 30 }, // Task name
      { wch: 40 }, // Description
      { wch: 15 }, // Status
      { wch: 15 }, // Priority
      { wch: 15 }, // Due date
      { wch: 50 }, // Assignments
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Task Details');
  }

  private addWorkloadSheet(workbook: XLSX.WorkBook, data: MatrixExportData) {
    if (!data.analytics) return;

    const workloadData: unknown[][] = [
      ['Member', 'Email', 'Responsible', 'Accountable', 'Consulted', 'Informed', 'Total'],
    ];

    Object.entries(data.analytics.workloadDistribution).forEach(([email, workload]) => {
      workloadData.push([
        workload.name,
        email,
        workload.responsible,
        workload.accountable,
        workload.consulted,
        workload.informed,
        workload.total,
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(workloadData);
    worksheet['!cols'] = [
      { wch: 25 },
      { wch: 30 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Workload Distribution');
  }

  private addCommentsSheet(workbook: XLSX.WorkBook, data: MatrixExportData) {
    if (!data.comments) return;

    const commentData: unknown[][] = [['Author', 'Date', 'Comment']];

    data.comments.forEach((comment) => {
      commentData.push([
        comment.author.name,
        comment.createdAt.toLocaleString(),
        comment.content,
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(commentData);
    worksheet['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 60 }];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Comments');
  }
}
