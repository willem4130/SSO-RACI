# Export & Reporting Feature - RACI Matrix Application

## Overview

Complete export and reporting system for RACI matrices with support for PDF, Excel, and CSV formats. Includes detailed analytics, workload distribution reports, and audit logging.

## Features Implemented

### 1. Matrix Export (PDF, Excel, CSV)
- **PDF Export**: Professionally formatted report with:
  - Matrix header and metadata
  - Full RACI matrix table with color-coded roles
  - Analytics dashboard (optional)
  - Comments and discussions (optional)
  - Validation issues and suggestions
  - Legend and formatting

- **Excel Export**: Multi-sheet workbook with:
  - RACI Matrix sheet
  - Task Details sheet (descriptions, status, priority, assignments)
  - Workload Distribution sheet
  - Comments sheet (if included)
  - Formatted columns and proper data types

- **CSV Export**: Simple format for:
  - Quick data import/export
  - Integration with other tools
  - Basic analysis in spreadsheet applications

### 2. Workload Report
- Organization-wide workload analysis
- Member assignment breakdown by RACI role
- Matrix-specific workload distribution
- Time-based filtering (all time, last month, quarter, year)
- Export in Excel or CSV format

### 3. Export UI Components
- **ExportDialog**: Matrix-level export with format selection
- **WorkloadReportExport**: Organization-level workload reports
- Real-time preview of export content
- Progress indicators during generation
- Automatic download on completion

## Architecture

### File Structure

```
src/
├── types/
│   └── export.ts                    # TypeScript type definitions
├── server/
│   ├── api/routers/
│   │   └── export.ts                # tRPC API endpoints
│   └── services/export/
│       ├── index.ts                 # Main export service orchestrator
│       ├── data-aggregator.ts       # Data fetching and aggregation
│       ├── pdf-exporter.ts          # PDF generation with pdfkit
│       └── excel-exporter.ts        # Excel/CSV generation with xlsx
└── components/
    ├── raci/
    │   └── export-dialog.tsx        # Matrix export UI component
    └── analytics/
        └── workload-report-export.tsx # Workload report UI component
```

### Dependencies Added

```json
{
  "pdfkit": "^0.15.0",
  "@types/pdfkit": "^0.13.5",
  "xlsx": "^0.18.5"
}
```

### API Endpoints

#### `export.exportMatrix`
Exports a RACI matrix in specified format.

**Input:**
```typescript
{
  matrixId: string;
  format: 'pdf' | 'excel' | 'csv';
  includeComments?: boolean;
  includeAnalytics?: boolean;
}
```

**Output:**
```typescript
{
  data: string; // base64 encoded file
  filename: string;
  mimeType: string;
}
```

#### `export.exportWorkloadReport`
Generates organization workload report.

**Input:**
```typescript
{
  organizationId: string;
  format: 'excel' | 'csv';
  startDate?: Date;
  endDate?: Date;
}
```

**Output:**
```typescript
{
  data: string; // base64 encoded file
  filename: string;
  mimeType: string;
}
```

#### `export.getExportHistory`
Retrieves export audit log.

**Input:**
```typescript
{
  organizationId: string;
  limit?: number; // default 20, max 100
}
```

#### `export.previewExportData`
Previews export content before download.

**Input:**
```typescript
{
  matrixId: string;
  includeComments?: boolean;
  includeAnalytics?: boolean;
}
```

## Usage Examples

### 1. Matrix Export Button

```tsx
import { ExportDialog } from '@/components/raci/export-dialog';

<ExportDialog matrixId={matrixId} matrixName={matrix.name} />
```

The button is already integrated in the matrix editor page at:
`src/app/(auth)/organizations/[id]/projects/[projectId]/matrices/[matrixId]/page.tsx:544`

### 2. Workload Report

```tsx
import { WorkloadReportExport } from '@/components/analytics/workload-report-export';

<WorkloadReportExport organizationId={organizationId} />
```

### 3. Programmatic Export

```typescript
import { exportService } from '@/server/services/export';

// Export matrix
const result = await exportService.exportMatrix(matrixId, 'pdf', {
  includeComments: true,
  includeAnalytics: true,
});

// Export workload report
const report = await exportService.exportWorkloadReport(
  organizationId,
  'excel',
  { start: new Date('2024-01-01'), end: new Date() }
);
```

## PDF Export Details

### Layout
- **Format**: A4 Landscape
- **Margins**: 50px all sides
- **Font**: Helvetica family (built-in)

### Sections
1. **Header**: Matrix name and title
2. **Metadata**: Project info, creator, dates, counts
3. **RACI Matrix Table**:
   - Color-coded roles (R=Blue, A=Green, C=Orange, I=Gray)
   - Max 6 members visible (scrollable in PDF)
   - Alternating row colors for readability
4. **Analytics** (optional):
   - Completion statistics
   - Workload distribution by member
   - Validation issues
5. **Comments** (optional):
   - Author, timestamp, content

## Excel Export Details

### Sheets

1. **RACI Matrix**:
   - Task names in column A
   - Members as column headers
   - RACI roles in cells

2. **Task Details**:
   - Full task information
   - Status, priority, due dates
   - Assignment summaries

3. **Workload Distribution**:
   - Member-by-member breakdown
   - Role counts (R, A, C, I)
   - Total assignments

4. **Comments** (optional):
   - Chronological comment list
   - Author and timestamps

### Formatting
- Column widths optimized for content
- Header rows in bold
- Proper data types (dates, numbers, text)

## Security & Permissions

- All exports require organization access verification
- Row-level security enforced via `verifyOrganizationAccess`
- Audit logging for all export operations
- Export history tracked in `AuditLog` table

## Audit Logging

Every export is logged with:
- User ID
- Organization ID
- Resource type and ID
- Export format
- Timestamp
- IP address (if available)

Query export history:
```typescript
const history = await api.export.getExportHistory.useQuery({
  organizationId: 'org-123',
  limit: 50,
});
```

## Performance Considerations

### Data Aggregation
- Single database query with joins for efficiency
- Includes only necessary relations
- Indexed queries for fast retrieval

### File Generation
- Buffer-based generation (no file system I/O)
- Streaming for large PDFs
- Base64 encoding for API transport

### Client-Side Download
- Blob creation from base64
- Automatic download trigger
- Memory cleanup after download

## Testing Checklist

### Manual Testing
- [ ] Export matrix as PDF with/without analytics
- [ ] Export matrix as PDF with/without comments
- [ ] Export matrix as Excel
- [ ] Export matrix as CSV
- [ ] Generate workload report (all time)
- [ ] Generate workload report (filtered date range)
- [ ] Verify all exported data matches database
- [ ] Test with large matrices (100+ tasks)
- [ ] Test with matrices having many members (20+)
- [ ] Verify audit logging

### Browser Compatibility
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari

## Future Enhancements

### Phase 6 Possibilities
1. **Email Reports**: Schedule and email exports
2. **Template Exports**: Export templates separately
3. **Batch Export**: Export multiple matrices at once
4. **Custom Branding**: Add organization logos and colors
5. **Export Automation**: Scheduled recurring exports
6. **Export API**: REST API for external integrations
7. **Print Optimization**: Direct browser print layouts

## Troubleshooting

### Export fails with large matrices
- Consider pagination for very large exports
- Increase API timeout if needed

### PDF formatting issues
- Verify pdfkit version compatibility
- Check font availability

### Excel compatibility
- Ensure xlsx library is up to date
- Test with Microsoft Excel and LibreOffice

## Related Documentation

- [API Documentation](./API_DOCUMENTATION.md)
- [Session History](./SESSION.md)
- [Project Structure](./CLAUDE.md)

## Support

For issues or questions:
1. Check the audit log for error details
2. Review server logs for export service errors
3. Verify database connectivity
4. Ensure required packages are installed
