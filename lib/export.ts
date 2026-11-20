import { format } from "date-fns";

export type ExportCell = string | number | null | undefined;

export type ExportColumn = {
  header: string;
  /** "money" and "number" stay numeric in Excel and are right-aligned. */
  kind?: "text" | "money" | "number";
};

export type ExportSection = {
  /** Excel sheet name (shortened and cleaned automatically). */
  name: string;
  /** Heading printed above the table in the PDF. */
  heading?: string;
  columns: ExportColumn[];
  rows: ExportCell[][];
  /** Optional closing row, e.g. totals. */
  totals?: ExportCell[];
};

export type ExportDocument = {
  /** File name without extension; today's date is added. */
  fileName: string;
  title: string;
  subtitle?: string;
  /** Key figures shown first: a "Summary" sheet in Excel, a box at the top of the PDF. */
  summary?: [string, string | number][];
  sections: ExportSection[];
};

const MONEY_FORMAT = "#,##0.00";

const stamp = () => format(new Date(), "yyyy-MM-dd");
const safeName = (name: string) => name.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "export";
const sheetName = (name: string, used: Set<string>) => {
  const base = name.replace(/[\\/?*[\]:]/g, " ").trim().slice(0, 28) || "Sheet";
  let candidate = base;
  let n = 2;
  while (used.has(candidate.toLowerCase())) candidate = `${base.slice(0, 25)} ${n++}`;
  used.add(candidate.toLowerCase());
  return candidate;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

function pdfText(cell: ExportCell, kind: ExportColumn["kind"]) {
  if (cell === null || cell === undefined || cell === "") return "";
  if (typeof cell === "number") return kind === "money" ? money(cell) : cell.toLocaleString("en-US");
  return String(cell);
}

export async function exportExcel(doc: ExportDocument) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const used = new Set<string>();
  const sheets: { sheet: string; data: unknown[][]; columns: { width: number }[] }[] = [];

  const headerCell = (value: string) => ({
    value,
    fontWeight: "bold",
    backgroundColor: "#4c1d95",
    textColor: "#ffffff",
  });

  if (doc.summary?.length) {
    sheets.push({
      sheet: sheetName("Summary", used),
      data: [
        [{ value: doc.title, fontWeight: "bold", fontSize: 14 }],
        ...(doc.subtitle ? [[{ value: doc.subtitle, textColor: "#6b7280" }]] : []),
        [{ value: `Generated ${format(new Date(), "PPP p")}`, textColor: "#6b7280" }],
        [],
        [headerCell("Measure"), headerCell("Value")],
        ...doc.summary.map(([label, value]) => [
          { value: label },
          typeof value === "number" ? { value, format: Number.isInteger(value) ? "#,##0" : MONEY_FORMAT, align: "right" } : { value: String(value), align: "right" },
        ]),
      ],
      columns: [{ width: 34 }, { width: 24 }],
    });
  }

  for (const section of doc.sections) {
    const data: unknown[][] = [section.columns.map((c) => headerCell(c.header))];
    for (const row of section.rows) {
      data.push(
        section.columns.map((column, i) => {
          const cell = row[i];
          if (cell === null || cell === undefined || cell === "") return null;
          if (typeof cell === "number") {
            return column.kind === "money"
              ? { value: cell, format: MONEY_FORMAT, align: "right" }
              : { value: cell, align: "right" };
          }
          return { value: String(cell) };
        }),
      );
    }
    if (section.totals) {
      data.push(
        section.columns.map((column, i) => {
          const cell = section.totals?.[i];
          if (cell === null || cell === undefined || cell === "") return null;
          return typeof cell === "number"
            ? { value: cell, fontWeight: "bold", format: column.kind === "money" ? MONEY_FORMAT : undefined, align: "right" }
            : { value: String(cell), fontWeight: "bold" };
        }),
      );
    }
    sheets.push({
      sheet: sheetName(section.name, used),
      data,
      columns: section.columns.map((column, i) => {
        const longest = Math.max(
          column.header.length,
          ...section.rows.slice(0, 200).map((r) => pdfText(r[i], column.kind).length),
        );
        return { width: Math.min(46, Math.max(11, longest + 3)) };
      }),
    });
  }

  // The library has no bundled types, so the call is loosely typed.
  await (writeXlsxFile as unknown as (s: unknown) => { toFile: (name: string) => Promise<void> })(sheets).toFile(
    `${safeName(doc.fileName)}-${stamp()}.xlsx`,
  );
}

const APEX = { name: "Apex Solution", site: "www.apexsolutionhub.com", logo: "/assets/apex-logo-dark-bg.png" };
const MEDICARE_LOGO = "/assets/medicare-logo.png";

async function imageToDataUrl(src: string | null): Promise<string | null> {
  if (!src) return null;
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || "") || null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const summaryText = (value: string | number) =>
  typeof value === "number" ? (Number.isInteger(value) ? value.toLocaleString("en-US") : money(value)) : value;

export async function exportPdf(doc: ExportDocument) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const autoTable = autoTableModule.default;

  let pharmacy = "";
  let companyLogoUrl: string | null = null;
  try {
    pharmacy = localStorage.getItem("Pharmacy") ?? "";
    companyLogoUrl = localStorage.getItem("Logo") || null;
  } catch {
    /* storage unavailable */
  }
  const [apexLogo, companyLogo, medicareLogo] = await Promise.all([
    imageToDataUrl(APEX.logo),
    imageToDataUrl(companyLogoUrl),
    imageToDataUrl(MEDICARE_LOGO),
  ]);

  const widest = Math.max(...doc.sections.map((sec) => sec.columns.length), 0);
  const pdf = new jsPDF({ orientation: widest > 7 ? "landscape" : "portrait", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 36;
  const contentW = pageW - margin * 2;
  const FOOTER_H = 46;
  const footerTop = pageH - 22 - FOOTER_H;
  const bottomLimit = footerTop - 14;

  const NAVY: [number, number, number] = [15, 23, 42];
  const VIOLET: [number, number, number] = [109, 40, 217];
  const INK: [number, number, number] = [30, 27, 75];

  // ---------- header band ----------
  const bandH = 92;
  pdf.setFillColor(...NAVY);
  pdf.rect(0, 0, pageW, bandH, "F");
  pdf.setFillColor(...VIOLET);
  pdf.rect(0, 0, pageW * 0.62, 5, "F");
  pdf.setFillColor(192, 38, 211);
  pdf.rect(pageW * 0.62, 0, pageW * 0.26, 5, "F");
  pdf.setFillColor(34, 211, 238);
  pdf.rect(pageW * 0.88, 0, pageW * 0.12, 5, "F");

  // The pharmacy's own logo leads on the left...
  let textX = margin;
  if (companyLogo) {
    try {
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(margin, 24, 46, 46, 8, 8, "F");
      pdf.addImage(companyLogo, "PNG", margin + 4, 28, 38, 38, undefined, "FAST");
      textX = margin + 60;
    } catch {
      textX = margin;
    }
  }
  if (pharmacy) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(196, 181, 253);
    pdf.text(pharmacy.toUpperCase(), textX, 32, { charSpace: 1 });
  }
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(21);
  pdf.setTextColor(255, 255, 255);
  pdf.text(doc.title, textX, 54);
  if (doc.subtitle) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(203, 213, 225);
    pdf.text(doc.subtitle, textX, 71, { maxWidth: contentW - (textX - margin) - 290 });
  }
  // ...and the Medicare wordmark (drawn for light backgrounds, so on a white plate) sits beside the date.
  let dateRight = pageW - margin;
  if (medicareLogo) {
    try {
      const plateW = 128;
      const plateH = 46;
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(pageW - margin - plateW, 24, plateW, plateH, 8, 8, "F");
      const logoH = plateH - 10;
      pdf.addImage(medicareLogo, "PNG", pageW - margin - plateW + 6, 29, logoH * (1000 / 322), logoH, undefined, "FAST");
      dateRight = pageW - margin - plateW - 16;
    } catch {
      dateRight = pageW - margin;
    }
  }
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(165, 180, 252);
  pdf.text("Generated", dateRight, 44, { align: "right" });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  pdf.text(format(new Date(), "PPP"), dateRight, 58, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(203, 213, 225);
  pdf.text(format(new Date(), "p"), dateRight, 71, { align: "right" });

  let y = bandH + 22;
  const lastY = () => (pdf as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;

  // ---------- summary cards ----------
  if (doc.summary?.length) {
    const cols = contentW > 600 ? 4 : 3;
    const gap = 10;
    const cardW = (contentW - gap * (cols - 1)) / cols;
    const cardH = 48;
    const accents: [number, number, number][] = [
      [124, 58, 237],
      [8, 145, 178],
      [219, 39, 119],
      [5, 150, 105],
      [217, 119, 6],
      [37, 99, 235],
    ];
    doc.summary.forEach(([label, value], i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = margin + col * (cardW + gap);
      const top = y + row * (cardH + gap);
      const [r, g, b] = accents[i % accents.length];
      pdf.setFillColor(250, 249, 255);
      pdf.setDrawColor(226, 222, 250);
      pdf.roundedRect(x, top, cardW, cardH, 7, 7, "FD");
      pdf.setFillColor(r, g, b);
      pdf.roundedRect(x, top + 8, 3.5, cardH - 16, 1.7, 1.7, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(r, g, b);
      pdf.text(label.toUpperCase(), x + 13, top + 17, { maxWidth: cardW - 24, charSpace: 0.5 });
      pdf.setTextColor(...INK);
      const room = cardW - 24;
      let text = summaryText(value);
      let size = 13;
      pdf.setFontSize(size);
      while (size > 8 && pdf.getTextWidth(text) > room) {
        size -= 0.5;
        pdf.setFontSize(size);
      }
      if (pdf.getTextWidth(text) > room) {
        while (text.length > 1 && pdf.getTextWidth(`${text}…`) > room) text = text.slice(0, -1);
        text = `${text.trimEnd()}…`;
      }
      pdf.text(text, x + 13, top + 36);
    });
    y += Math.ceil(doc.summary.length / cols) * (cardH + gap) + 14;
  }

  // ---------- tables ----------
  for (const section of doc.sections) {
    if (!section.rows.length) continue;
    if (section.heading) {
      if (y > bottomLimit - 60) {
        pdf.addPage();
        y = margin;
      }
      pdf.setFillColor(...VIOLET);
      pdf.roundedRect(margin, y - 11, 4, 15, 2, 2, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12.5);
      pdf.setTextColor(...INK);
      pdf.text(section.heading, margin + 11, y);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(120, 113, 160);
      pdf.text(`${section.rows.length} row${section.rows.length === 1 ? "" : "s"}`, pageW - margin, y, { align: "right" });
      y += 9;
    }
    const body = section.rows.map((row) => section.columns.map((c, i) => pdfText(row[i], c.kind)));
    const hasTotals = Boolean(section.totals);
    if (section.totals) body.push(section.columns.map((c, i) => pdfText(section.totals?.[i], c.kind)));
    autoTable(pdf, {
      startY: y,
      margin: { left: margin, right: margin, bottom: pageH - bottomLimit, top: margin },
      head: [section.columns.map((c) => c.header)],
      body,
      theme: "plain",
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: { top: 5, bottom: 5, left: 6, right: 6 }, textColor: INK, overflow: "linebreak", lineColor: [233, 230, 247], lineWidth: 0 },
      headStyles: { fillColor: VIOLET, textColor: 255, fontStyle: "bold", fontSize: 8, cellPadding: { top: 6, bottom: 6, left: 6, right: 6 } },
      alternateRowStyles: { fillColor: [248, 246, 255] },
      columnStyles: Object.fromEntries(
        section.columns.map((c, i) => [i, c.kind === "money" || c.kind === "number" ? { halign: "right" as const } : {}]),
      ),
      didParseCell: (data) => {
        const right = section.columns[data.column.index]?.kind === "money" || section.columns[data.column.index]?.kind === "number";
        if (data.section === "head" && right) data.cell.styles.halign = "right";
        if (hasTotals && data.section === "body" && data.row.index === body.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [237, 233, 254];
          data.cell.styles.textColor = [76, 29, 149];
        }
      },
      didDrawCell: (data) => {
        // thin rule under each body row
        if (data.section === "body") {
          pdf.setDrawColor(233, 230, 247);
          pdf.setLineWidth(0.4);
          pdf.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        }
      },
    });
    y = lastY() + 28;
  }

  // ---------- footer on every page (Apex branding, receipt style) ----------
  const printed = format(new Date(), "PP p");
  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);

    pdf.setFillColor(236, 253, 245);
    pdf.setDrawColor(167, 243, 208);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(margin, footerTop, contentW, FOOTER_H, 8, 8, "FD");
    // soft amber wash on the right, like the receipt gradient
    pdf.setFillColor(255, 251, 235);
    pdf.roundedRect(margin + contentW * 0.62, footerTop + 1, contentW * 0.38 - 1, FOOTER_H - 2, 7, 7, "F");

    let nameX = margin + 14;
    if (apexLogo) {
      try {
        pdf.setFillColor(11, 22, 41);
        pdf.roundedRect(margin + 10, footerTop + 9, 84, 28, 5, 5, "F");
        pdf.addImage(apexLogo, "PNG", margin + 12, footerTop + 11, 80, 24, undefined, "FAST");
        nameX = margin + 106;
      } catch {
        nameX = margin + 14;
      }
    }
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10.5);
    pdf.setTextColor(2, 44, 34);
    pdf.text(APEX.name, nameX, footerTop + 20);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(4, 120, 87);
    pdf.text(APEX.site, nameX, footerTop + 33);

    const rightEdge = pageW - margin - 14;
    const lead = "Powered by ";
    const tail = " \u00b7 Pharmacy management";
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    const leadW = pdf.getTextWidth(lead);
    const tailW = pdf.getTextWidth(tail);
    pdf.setFont("helvetica", "bold");
    const nameW = pdf.getTextWidth(APEX.name);
    let cursor = rightEdge - (leadW + nameW + tailW);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(71, 85, 105);
    pdf.text(lead, cursor, footerTop + 20);
    cursor += leadW;
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(6, 78, 59);
    pdf.text(APEX.name, cursor, footerTop + 20);
    cursor += nameW;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(71, 85, 105);
    pdf.text(tail, cursor, footerTop + 20);
    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Printed ${printed}  ·  Page ${i} of ${pages}`, pageW - margin - 14, footerTop + 33, { align: "right" });
  }

  pdf.save(`${safeName(doc.fileName)}-${stamp()}.pdf`);
}
