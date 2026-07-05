type PdfSection = {
  title: string;
  rows: string[];
};

type PdfLine = {
  size: number;
  text: string;
  tone: 'body' | 'muted' | 'section';
};

const pageWidth = 595;
const pageHeight = 842;
const marginX = 48;
const headerHeight = 58;
const contentTop = pageHeight - headerHeight - 34;
const contentBottom = 64;

export function buildAnalyticsPdfReport(
  title: string,
  generatedAt: string,
  sections: PdfSection[],
) {
  const lines = sections.flatMap((section) => [
    { size: 13, text: section.title, tone: 'section' as const },
    ...normalizeRows(section.rows).map((row) => ({
      size: 10,
      text: row,
      tone: 'body' as const,
    })),
    { size: 7, text: '', tone: 'muted' as const },
  ]);

  return buildPdf(title, generatedAt, paginate(lines));
}

function normalizeRows(rows: string[]) {
  return rows.length > 0
    ? rows.map((row) => truncate(row, 112))
    : ['Sin datos'];
}

function paginate(lines: PdfLine[]) {
  const pages: PdfLine[][] = [];
  let current: PdfLine[] = [];
  let y = contentTop;

  for (const line of lines) {
    const height = line.tone === 'section' ? 24 : 16;

    if (y - height < contentBottom) {
      pages.push(current);
      current = [];
      y = contentTop;
    }

    current.push(line);
    y -= height;
  }

  if (current.length > 0) {
    pages.push(current);
  }

  return pages;
}

function buildPdf(title: string, generatedAt: string, pages: PdfLine[][]) {
  const objects: string[] = [];
  const catalogId = addObject(objects, '<< /Type /Catalog /Pages 2 0 R >>');
  const pagesId = addObject(objects, '');
  const regularFontId = addObject(
    objects,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  );
  const boldFontId = addObject(
    objects,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  );
  const pageIds: number[] = [];

  pages.forEach((page, index) => {
    const content = pageContent(
      title,
      generatedAt,
      page,
      index + 1,
      pages.length,
    );
    const contentId = addObject(
      objects,
      `<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`,
    );
    const pageId = addObject(
      objects,
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    pageIds.push(pageId);
  });

  objects[pagesId - 1] =
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  return writePdf(objects, catalogId);
}

function pageContent(
  title: string,
  generatedAt: string,
  lines: PdfLine[],
  pageNumber: number,
  totalPages: number,
) {
  const commands = [
    '0.00 0.42 0.37 rg',
    `0 ${pageHeight - headerHeight} ${pageWidth} ${headerHeight} re f`,
    '1 1 1 rg',
    textCommand('F2', 18, marginX, pageHeight - 34, title),
    textCommand('F1', 9, marginX, pageHeight - 50, `Generado: ${generatedAt}`),
    '0.84 0.64 0.23 rg',
    `${marginX} ${pageHeight - headerHeight - 10} ${pageWidth - marginX * 2} 2 re f`,
  ];
  let y = contentTop;

  for (const line of lines) {
    if (line.tone === 'section') {
      commands.push('0.84 0.64 0.23 rg');
      commands.push(`${marginX} ${y - 4} 4 14 re f`);
      commands.push('0.05 0.08 0.12 rg');
      commands.push(textCommand('F2', line.size, marginX + 12, y, line.text));
      y -= 24;
      continue;
    }

    commands.push(
      line.tone === 'muted' ? '0.39 0.45 0.55 rg' : '0.15 0.20 0.28 rg',
    );
    commands.push(textCommand('F1', line.size, marginX, y, line.text));
    y -= line.text ? 16 : 10;
  }

  commands.push('0.89 0.91 0.94 rg');
  commands.push(`${marginX} 46 ${pageWidth - marginX * 2} 1 re f`);
  commands.push('0.39 0.45 0.55 rg');
  commands.push(
    textCommand(
      'F1',
      8,
      marginX,
      30,
      `Qori SmartBudget · Página ${pageNumber} de ${totalPages}`,
    ),
  );

  return commands.join('\n');
}

function textCommand(
  font: 'F1' | 'F2',
  size: number,
  x: number,
  y: number,
  value: string,
) {
  return `BT /${font} ${size} Tf ${x} ${y} Td ${toUtf16Hex(value)} Tj ET`;
}

function writePdf(objects: string[], catalogId: number) {
  const chunks = ['%PDF-1.4\n'];
  const offsets = [0];
  let length = Buffer.byteLength(chunks[0], 'latin1');

  objects.forEach((object, index) => {
    offsets.push(length);
    const chunk = `${index + 1} 0 obj\n${object}\nendobj\n`;
    chunks.push(chunk);
    length += Buffer.byteLength(chunk, 'latin1');
  });

  const xrefOffset = length;
  const xref = [
    `xref\n0 ${objects.length + 1}\n`,
    '0000000000 65535 f \n',
    ...offsets
      .slice(1)
      .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`),
    `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
  ].join('');

  return Buffer.from([...chunks, xref].join(''), 'latin1');
}

function addObject(objects: string[], value: string) {
  objects.push(value);
  return objects.length;
}

function toUtf16Hex(value: string) {
  const buffer = Buffer.from(`\uFEFF${value}`, 'utf16le');
  const bytes: number[] = [];

  for (let index = 0; index < buffer.length; index += 2) {
    bytes.push(buffer[index + 1] ?? 0, buffer[index] ?? 0);
  }

  return `<${Buffer.from(bytes).toString('hex').toUpperCase()}>`;
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength
    ? `${value.slice(0, maxLength - 3)}...`
    : value;
}
