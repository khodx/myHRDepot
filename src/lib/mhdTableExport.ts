export interface MhdExportColumn<T> {
  header: string;
  accessor: (row: T) => string;
}

export type MhdExportFormat = 'csv' | 'xlsx' | 'docx' | 'pdf';

export interface MhdExportTableOptions<T> {
  format: MhdExportFormat;
  filenameBase: string;
  title: string;
  columns: MhdExportColumn<T>[];
  rows: T[];
}

function mhdDownloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function buildCsv<T>(options: MhdExportTableOptions<T>): string {
  const rows = [
    options.columns.map((column) => column.header),
    ...options.rows.map((row) => options.columns.map((column) => column.accessor(row))),
  ];
  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
}

export async function mhdExportTable<T>(options: MhdExportTableOptions<T>): Promise<void> {
  if (options.format === 'csv') {
    mhdDownloadBlob(
      new Blob([buildCsv(options)], { type: 'text/csv;charset=utf-8' }),
      `${options.filenameBase}.csv`,
    );
    return;
  }

  if (options.format === 'xlsx') {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(options.title.slice(0, 31));
    sheet.columns = options.columns.map((column) => ({ header: column.header, width: 22 }));
    sheet.getRow(1).font = { bold: true };
    for (const row of options.rows) {
      sheet.addRow(options.columns.map((column) => column.accessor(row)));
    }
    const buffer = await workbook.xlsx.writeBuffer();
    mhdDownloadBlob(
      new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      `${options.filenameBase}.xlsx`,
    );
    return;
  }

  if (options.format === 'pdf') {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text(options.title, 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [options.columns.map((column) => column.header)],
      body: options.rows.map((row) => options.columns.map((column) => column.accessor(row))),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 3, 170] },
    });
    mhdDownloadBlob(doc.output('blob'), `${options.filenameBase}.pdf`);
    return;
  }

  const { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, TextRun } =
    await import('docx');
  const headerRow = new TableRow({
    children: options.columns.map(
      (column) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: column.header, bold: true })] })],
        }),
    ),
  });
  const bodyRows = options.rows.map(
    (row) =>
      new TableRow({
        children: options.columns.map(
          (column) => new TableCell({ children: [new Paragraph(column.accessor(row))] }),
        ),
      }),
  );
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: options.title, heading: HeadingLevel.HEADING_1 }),
          new Table({ rows: [headerRow, ...bodyRows] }),
        ],
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  mhdDownloadBlob(blob, `${options.filenameBase}.docx`);
}
