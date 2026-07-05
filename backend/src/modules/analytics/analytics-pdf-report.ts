type PdfSection = {
  title: string;
  rows: string[];
};

const pageWidth = 595;
const pageHeight = 842;
const marginX = 48;
const lineHeight = 18;
const titleSize = 18;
const bodySize = 10;

export function buildAnalyticsPdfReport(
  title: string,
  generatedAt: string,
  sections: PdfSection[],
) {
  const pages = paginate([
    { size: titleSize, text: title },
    { size: bodySize, text: `Generado: ${generatedAt}` },
    { size: bodySize, text: '' },
    ...sections.flatMap((section) => [
      { size: 13, text: section.title },
      ...section.rows.map((row) => ({ size: bodySize, text: row })),
      { size: bodySize, text: '' },
    ]),
  ]);

  return buildPdf(pages);
}

function paginate(lines: Array<{ size: number; text: string }>) {
  const pages: Array<Array<{ size: number; text: string }>> = [];
  let current: Array<{ size: number; text: string }> = [];
  let y = pageHeight - marginX;

  for (const line of lines) {
    if (y < marginX) {
      pages.push(current);
      current = [];
      y = pageHeight - marginX;
    }

    current.push(line);
    y -= lineHeight;
  }

  if (current.length > 0) {
    pages.push(current);
  }

  return pages;
}

function buildPdf(pages: Array<Array<{ size: number; text: string }>>) {
  const objects: string[] = [];
  const catalogId = addObject(objects, '<< /Type /Catalog /Pages 2 0 R >>');
  const pagesId = addObject(objects, '');
  const fontId = addObject(
    objects,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  );
  const pageIds: number[] = [];

  for (const page of pages) {
    const content = pageContent(page);
    const contentId = addObject(
      objects,
      `<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`,
    );
    const pageId = addObject(
      objects,
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    pageIds.push(pageId);
  }

  objects[pagesId - 1] =
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  return writePdf(objects, catalogId);
}

function pageContent(lines: Array<{ size: number; text: string }>) {
  let y = pageHeight - marginX;

  return lines
    .map((line) => {
      const content = `BT /F1 ${line.size} Tf ${marginX} ${y} Td ${toUtf16Hex(line.text)} Tj ET`;
      y -= lineHeight;
      return content;
    })
    .join('\n');
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
