// BusLine — Feature List & Pricing (custom build)
// Plain-language feature catalogue + pricing portion.
// Same visual design as the BusLine app (emerald + amber).
// Output: /home/z/my-project/download/BusLine-Feature-List-and-Pricing.docx

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Header,
  Footer,
  AlignmentType,
  HeadingLevel,
  PageNumber,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} = require("docx");
const fs = require("fs");
const path = require("path");

// ---- Palette (matches BusLine app) ----
const P = {
  primary: "#0F7050",   // emerald
  accent:  "#B7791F",   // amber
  body:    "#1A1A1A",
  muted:   "#5A6B5E",
  rowAlt:  "#F4F1EC",   // soft cream for alt table rows
};
const c = (hex) => hex.replace("#", "");

const FONT_BODY = { ascii: "Times New Roman", hAnsi: "Times New Roman" };
const FONT_HEAD = { ascii: "Calibri", hAnsi: "Calibri" };

// ---- Helpers ----
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 140, line: 360 },
    children: [
      new TextRun({ text, bold: true, size: 30, color: c(P.primary), font: FONT_HEAD }),
    ],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 80, line: 320 },
    children: [
      new TextRun({ text, bold: true, size: 24, color: c(P.primary), font: FONT_HEAD }),
    ],
  });
}

// Bullet-style line with a leading emerald dot. Left-aligned, no first-line indent.
function bullet(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 300, after: 60 },
    indent: { left: 360, hanging: 360 },
    children: [
      new TextRun({ text: "•  ", bold: true, size: 24, color: c(P.primary), font: FONT_BODY }),
      new TextRun({ text, size: 24, color: c(P.body), font: FONT_BODY }),
    ],
  });
}

function body(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: 120 },
    children: [
      new TextRun({ text, size: 24, color: c(P.body), font: FONT_BODY }),
    ],
  });
}

function ruleParagraph() {
  return new Paragraph({
    spacing: { before: 0, after: 200 },
    border: { bottom: { color: c(P.primary), space: 1, style: BorderStyle.SINGLE, size: 8 } },
    children: [new TextRun({ text: "" })],
  });
}

// ---- Table helpers ----
function tableCell(text, opts = {}) {
  const isHeader = !!opts.header;
  const align = opts.align || AlignmentType.LEFT;
  return new TableCell({
    margins: { top: 120, bottom: 120, left: 160, right: 160 },
    shading: isHeader
      ? { type: ShadingType.CLEAR, fill: c(P.primary), color: "auto" }
      : opts.alt
        ? { type: ShadingType.CLEAR, fill: c(P.rowAlt), color: "auto" }
        : undefined,
    children: [
      new Paragraph({
        alignment: align,
        spacing: { line: 280 },
        children: [
          new TextRun({
            text,
            bold: isHeader || !!opts.bold,
            size: isHeader ? 22 : 22, // 11pt
            color: isHeader ? "FFFFFF" : c(P.body),
            font: FONT_BODY,
          }),
        ],
      }),
    ],
  });
}

function pricingTable() {
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: [
      tableCell("Item", { header: true }),
      tableCell("Description", { header: true }),
      tableCell("Price (BDT)", { header: true, align: AlignmentType.RIGHT }),
    ],
  });

  const rows = [
    ["One-time custom build", "Full platform — passenger booking app, live tracking, owner dashboard, source code, training, and handover.", "৳18,00,000"],
    ["Monthly support", "Bug fixes, minor changes, hosting oversight, email support (optional).", "৳35,000 / month"],
    ["Real GPS hardware", "GPS device per bus, installed and configured for auto position reporting.", "৳12,000 / bus"],
    ["SMS gateway", "Booking confirmations, departure reminders, delay alerts per passenger.", "৳0.40 / SMS sent"],
    ["Mobile apps (iOS + Android)", "Native passenger apps alongside the web app.", "৳6,00,000 one-time"],
  ];

  const dataRows = rows.map((r, i) => new TableRow({
    cantSplit: true,
    children: [
      tableCell(r[0], { bold: true, alt: i % 2 === 1 }),
      tableCell(r[1], { alt: i % 2 === 1 }),
      tableCell(r[2], { alt: i % 2 === 1, align: AlignmentType.RIGHT, bold: true }),
    ],
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [3000, 6000, 2500],
    rows: [headerRow, ...dataRows],
  });
}

// ---- Document children ----
const children = [];

// === Title block ===
children.push(
  new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({
        text: "FEATURE LIST & PRICING",
        bold: true,
        size: 18,
        color: c(P.accent),
        font: FONT_HEAD,
        characterSpacing: 60,
      }),
    ],
  })
);

children.push(
  new Paragraph({
    spacing: { after: 120, line: 360 },
    children: [
      new TextRun({
        text: "BusLine — Bus Ticketing & Live Tracking Platform",
        bold: true,
        size: 36,
        color: c(P.primary),
        font: FONT_HEAD,
      }),
    ],
  })
);

children.push(
  new Paragraph({
    spacing: { after: 200 },
    children: [
      new TextRun({
        text: "Custom Build — What's Included and What It Costs",
        italics: true,
        size: 24,
        color: c(P.muted),
        font: FONT_HEAD,
      }),
    ],
  })
);

// Sender block (compact, right-aligned)
children.push(
  new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 40 },
    children: [
      new TextRun({ text: "BusLine  ·  hello@busline.example  ·  +880 1XXX-XXXXXX  ·  busline.example", size: 20, color: c(P.muted), font: FONT_BODY }),
    ],
  })
);
children.push(
  new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 200 },
    children: [
      new TextRun({ text: "Date: " + new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }), size: 20, color: c(P.muted), font: FONT_BODY }),
    ],
  })
);

children.push(ruleParagraph());

// === 1. Features Already Built ===
children.push(h1("1. Features Already Built"));

children.push(h2("For Passengers"));
children.push(bullet("Search available trips by route and date."));
children.push(bullet("See bus type, departure time, fare, and remaining seats for each trip."));
children.push(bullet("Pick seats on a visual seat map — booked seats are clearly marked."));
children.push(bullet("Pay online using card, bKash, Nagad, or cash at counter."));
children.push(bullet("Get an instant e-ticket with booking ID, seat numbers, boarding point, and total paid."));
children.push(bullet("Look up past bookings anytime using email or phone."));

children.push(h2("Live Bus Tracking"));
children.push(bullet("See the bus moving on a live route map."));
children.push(bullet("View the current counter the bus is at, and the next stop it is heading to."));
children.push(bullet("See estimated arrival time at the next stop, current speed, and overall trip progress."));
children.push(bullet("Full stop-by-stop timeline showing which stops the bus has passed and which are upcoming."));

children.push(h2("For the Owner (Admin Dashboard)"));
children.push(bullet("Dashboard with key numbers: total revenue, tickets sold, active buses, and routes."));
children.push(bullet("Revenue-by-route chart showing which routes earn the most."));
children.push(bullet("Add new buses with plate number, seat count, type, and driver details."));
children.push(bullet("Build new routes with their stops (counters) and addresses."));
children.push(bullet("Schedule new trips by combining a bus, a route, departure and arrival times, and per-seat price."));
children.push(bullet("Move any active bus forward stop-by-stop from the dashboard — passengers see the update live instantly."));

// === 2. Features Planned Next ===
children.push(h1("2. Features Planned Next"));
children.push(bullet("Real GPS device in each bus — the bus reports its own position automatically, no manual updates needed."));
children.push(bullet("SMS and email alerts — booking confirmation, departure reminders, and delay notifications."));
children.push(bullet("QR-code boarding pass scannable by the conductor."));
children.push(bullet("Refund and cancellation flow with automatic seat release."));
children.push(bullet("Native mobile apps for passengers (iOS and Android), alongside the web app."));
children.push(bullet("Reports and analytics — revenue trends, route performance, and no-show tracking."));

// === 3. Pricing ===
children.push(h1("3. Pricing"));
children.push(
  body(
    "The pricing below covers the one-time custom build of the BusLine platform, optional monthly support, and the most common add-ons. All prices are in Bangladeshi Taka (BDT). Final pricing will be confirmed in a scoping workshop based on fleet size, number of routes, and required go-live date."
  )
);
children.push(pricingTable());

children.push(
  new Paragraph({
    spacing: { before: 200, after: 120, line: 312 },
    alignment: AlignmentType.JUSTIFIED,
    children: [
      new TextRun({ text: "Note: ", bold: true, size: 22, color: c(P.muted), font: FONT_BODY }),
      new TextRun({
        text: "The one-time build fee includes design, development, testing, deployment, source code handover, documentation, and operator training. GPS hardware and SMS costs are usage-based and billed separately. Travel and on-site training outside Dhaka are billed at cost.",
        size: 22, color: c(P.muted), font: FONT_BODY, italics: true,
      }),
    ],
  })
);

// ---- Document ----
const doc = new Document({
  creator: "BusLine",
  title: "BusLine — Feature List & Pricing",
  description: "Feature catalogue and pricing for the BusLine custom-build engagement",
  styles: {
    default: {
      document: {
        run: { font: FONT_BODY, size: 24, color: c(P.body) },
        paragraph: { spacing: { line: 312 } },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: "BusLine  ·  Feature List & Pricing", size: 18, color: c(P.muted), font: FONT_HEAD }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.muted), font: FONT_BODY }),
              ],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

const outDir = "/home/z/my-project/download";
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "BusLine-Feature-List-and-Pricing.docx");

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log("Wrote:", outPath);
  console.log("Size:", buf.length, "bytes");
});
