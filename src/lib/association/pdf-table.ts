export type PdfColumn = {
  key: string;
  label: string;
  width: number;
  align?: "left" | "right" | "center";
};

export type PdfTableInput = {
  title: string;
  subtitle?: string;
  meta?: string[];
  columns: PdfColumn[];
  rows: Record<string, unknown>[];
  orientation?: "portrait" | "landscape";
  footer?: string;
};

function winAnsi(text: string): string {
  let out = "";
  for (const ch of text) {
    const c = ch.codePointAt(0) ?? 63;
    if (ch === "\u202f" || ch === "\u00a0") {
      out += " ";
    } else if (c < 128 || (c >= 160 && c <= 255)) {
      out += ch;
    } else if (ch === "€") {
      out += "EUR";
    } else if (ch === "’" || ch === "‘") {
      out += "'";
    } else if (ch === "“" || ch === "”") {
      out += '"';
    } else if (ch === "–" || ch === "—" || ch === "•") {
      out += "-";
    } else if (ch === "…") {
      out += "...";
    } else {
      out += "?";
    }
  }
  return out;
}

function escapePdf(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function truncate(text: string, maxChars: number): string {
  if (maxChars <= 1) return "";
  return text.length <= maxChars ? text : `${text.slice(0, Math.max(0, maxChars - 1))}…`;
}

function fmtCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") {
    return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(value);
  }
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (value instanceof Date) return value.toLocaleDateString("fr-FR");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function buildTablePdf(input: PdfTableInput): Buffer {
  const landscape = (input.orientation ?? "landscape") === "landscape";
  const pageW = landscape ? 842 : 595;
  const pageH = landscape ? 595 : 842;
  const margin = 30;
  const contentW = pageW - margin * 2;
  const titleSize = 17;
  const subtitleSize = 9;
  const metaSize = 7.5;
  const tableSize = 7.2;
  const headerSize = 7.4;
  const rowH = 15;
  const headerH = 19;
  const rowsPerPage = Math.max(8, Math.floor((pageH - margin * 2 - 105) / rowH));

  const totalWidth = input.columns.reduce((sum, c) => sum + c.width, 0) || 1;
  const columns = input.columns.map((c) => ({
    ...c,
    width: (c.width / totalWidth) * contentW,
  }));

  const pages: string[][] = [];
  let current: string[] = [];
  let y = pageH - margin;

  const beginPage = () => {
    current = [];
    y = pageH - margin;
    // Green header band.
    current.push("0.051 0.239 0.157 rg");
    current.push(`${margin} ${pageH - 58} ${contentW} 34 re f`);
    current.push("BT /F1 15 Tf 1 1 1 rg");
    current.push(`1 0 0 1 ${margin + 10} ${pageH - 40} Tm (${escapePdf(winAnsi(truncate(input.title, 105)))}) Tj ET`);
    if (input.subtitle) {
      current.push("BT /F1 8 Tf 0.86 0.92 0.88 rg");
      current.push(`1 0 0 1 ${margin + 10} ${pageH - 52} Tm (${escapePdf(winAnsi(truncate(input.subtitle, 150)))}) Tj ET`);
    }
    y = pageH - 80;
    // Meta line(s).
    if (input.meta?.length) {
      const meta = input.meta.join("   •   ");
      current.push("BT /F1 7.5 Tf 0.25 0.25 0.25 rg");
      current.push(`1 0 0 1 ${margin} ${y} Tm (${escapePdf(winAnsi(truncate(meta, 170)))}) Tj ET`);
      y -= 16;
    }
    // Table header.
    current.push("0.93 0.95 0.92 rg");
    current.push(`${margin} ${y - headerH + 3} ${contentW} ${headerH} re f`);
    current.push("BT /F1 7.4 Tf 0.05 0.20 0.13 rg");
    let x = margin;
    for (const col of columns) {
      current.push(`1 0 0 1 ${x + 3} ${y - 11} Tm (${escapePdf(winAnsi(truncate(col.label, Math.max(3, Math.floor(col.width / 4.3)))))}) Tj`);
      x += col.width;
    }
    current.push("ET");
    y -= headerH + 1;
  };

  const flush = () => {
    if (current.length) pages.push(current);
    current = [];
  };

  beginPage();
  let pageRows = 0;

  input.rows.forEach((row, index) => {
    if (pageRows >= rowsPerPage) {
      flush();
      beginPage();
      pageRows = 0;
    }
    if (index % 2 === 1) {
      current.push("0.975 0.975 0.965 rg");
      current.push(`${margin} ${y - rowH + 3} ${contentW} ${rowH} re f`);
    }
    current.push("BT /F1 7.2 Tf 0.12 0.12 0.12 rg");
    let x = margin;
    for (const col of columns) {
      const raw = winAnsi(fmtCell(row[col.key]));
      const text = truncate(raw, Math.max(3, Math.floor(col.width / 3.9)));
      let tx = x + 3;
      if (col.align === "right") {
        const approxWidth = text.length * 3.6;
        tx = x + col.width - 4 - approxWidth;
      } else if (col.align === "center") {
        const approxWidth = text.length * 3.6;
        tx = x + (col.width - approxWidth) / 2;
      }
      current.push(`1 0 0 1 ${tx} ${y - 8} Tm (${escapePdf(text)}) Tj`);
      x += col.width;
    }
    current.push("ET");
    y -= rowH;
    pageRows += 1;
  });

  if (!input.rows.length) {
    current.push("BT /F1 8 Tf 0.35 0.35 0.35 rg");
    current.push(`1 0 0 1 ${margin + 4} ${y - 2} Tm (Aucune donnée pour cette période.) Tj ET`);
    y -= rowH;
  }
  flush();

  const pageCount = pages.length;
  const objects: string[] = [];
  // 1 catalog, 2 pages, 3 font, then page/content pairs.
  const kids = pages.map((_, idx) => `${4 + idx * 2} 0 R`).join(" ");
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";

  pages.forEach((ops, idx) => {
    const pageObj = 4 + idx * 2;
    const contentObj = pageObj + 1;
    const footer = winAnsi(
      `${input.footer ?? "Tchoua — document confidentiel"}   |   Page ${idx + 1}/${pageCount}   |   ${new Date().toLocaleString("fr-FR")}`
    );
    const footerOps = [
      "0.45 0.45 0.45 rg",
      "BT /F1 6.5 Tf",
      `1 0 0 1 ${margin} 18 Tm (${escapePdf(footer)}) Tj ET`,
    ];
    const stream = [...ops, ...footerOps].join("\n");
    objects[pageObj] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] ` +
      `/Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObj} 0 R >>`;
    objects[contentObj] = `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`;
  });

  let out = "%PDF-1.4\n";
  const maxObj = 3 + pageCount * 2;
  const offsets: number[] = [];
  for (let i = 1; i <= maxObj; i += 1) {
    offsets[i] = Buffer.byteLength(out, "latin1");
    out += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(out, "latin1");
  out += `xref\n0 ${maxObj + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= maxObj; i += 1) {
    out += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  out += `trailer\n<< /Size ${maxObj + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(out, "latin1");
}
