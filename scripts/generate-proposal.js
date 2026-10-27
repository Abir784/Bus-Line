// Commercial Proposal — BusLine Custom Build Engagement
// Output: /home/z/my-project/download/BusLine-Commercial-Proposal.docx

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
  LevelFormat,
  TabStopType,
  TabStopPosition,
  BorderStyle,
} = require("docx");
const fs = require("fs");
const path = require("path");

// ---- Palette ----
// Consultative proposal — calm dark green primary (no indigo/blue), warm accent.
const P = {
  primary: "#0F5132",   // deep forest green
  accent: "#B7791F",    // warm amber
  body: "#1A1A1A",      // near-black
  muted: "#5A6B5E",     // muted green-grey
  rule: "#0F5132",
};
const c = (hex) => hex.replace("#", "");

// ---- Font profile (Formal — Profile A) ----
// English document → Times New Roman for body, Calibri for headings to give a modern consultancy feel.
const FONT_BODY = { ascii: "Times New Roman", hAnsi: "Times New Roman" };
const FONT_HEAD = { ascii: "Calibri", hAnsi: "Calibri" };

// ---- Helpers ----
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160, line: 360 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 30, // 15pt
        color: c(P.primary),
        font: FONT_HEAD,
      }),
    ],
  });
}

function body(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: 120 },
    children: [
      new TextRun({
        text,
        size: 24, // 12pt
        color: c(P.body),
        font: FONT_BODY,
      }),
    ],
  });
}

// Body paragraph that allows inline bold runs.
function bodyRich(runs) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: 120 },
    children: runs.map((r) =>
      new TextRun({
        text: r.text,
        bold: !!r.bold,
        italics: !!r.italic,
        size: 24,
        color: c(r.color || P.body),
        font: FONT_BODY,
      })
    ),
  });
}

// Horizontal rule via paragraph border.
function ruleParagraph() {
  return new Paragraph({
    spacing: { before: 0, after: 200 },
    border: {
      bottom: { color: c(P.primary), space: 1, style: BorderStyle.SINGLE, size: 8 },
    },
    children: [new TextRun({ text: "" })],
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
        text: "COMMERCIAL PROPOSAL",
        bold: true,
        size: 18, // 9pt — small label
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
        text: "Building Bangladesh's Next-Generation Bus Ticketing & Live-Tracking Platform",
        bold: true,
        size: 40, // 20pt
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
        text: "A Custom Build Engagement — Prepared for Investor Review",
        italics: true,
        size: 24, // 12pt
        color: c(P.muted),
        font: FONT_HEAD,
      }),
    ],
  })
);

// Sender / contact block (right-aligned)
children.push(
  new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 60 },
    children: [
      new TextRun({
        text: "BusLine",
        bold: true,
        size: 22,
        color: c(P.primary),
        font: FONT_HEAD,
      }),
    ],
  })
);
children.push(
  new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 40 },
    children: [
      new TextRun({
        text: "hello@busline.example  ·  +880 1XXX-XXXXXX",
        size: 20,
        color: c(P.muted),
        font: FONT_BODY,
      }),
    ],
  })
);
children.push(
  new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 40 },
    children: [
      new TextRun({
        text: "busline.example",
        size: 20,
        color: c(P.muted),
        font: FONT_BODY,
      }),
    ],
  })
);

children.push(
  new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 240 },
    children: [
      new TextRun({
        text: "Date: " + new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
        size: 20,
        color: c(P.muted),
        font: FONT_BODY,
      }),
    ],
  })
);

children.push(ruleParagraph());

// === 1. Executive Summary ===
children.push(h1("1. Executive Summary"));
children.push(
  body(
    "BusLine proposes to design and build, on a one-time custom-engagement basis, a complete intercity bus ticketing platform with live, counter-by-counter bus tracking — purpose-built for a single operator-investor to own outright. The product combines a passenger booking app (route search, seat map, multi-method payments, e-ticket confirmation), a real-time tracking layer showing passengers exactly which counter their bus is at and when it arrives, and an owner dashboard for adding routes, counters, buses, trips, and pricing without marketplace dependencies. The opportunity is modelled on Shohoz.com's market validation but takes a product-first position. The ask is capital to fund the build; the outcome is a defensible, owned technology asset in a consolidating market."
  )
);

// === 2. Market Opportunity ===
children.push(h1("2. Market Opportunity"));
children.push(
  body(
    "Shohoz.com has, over the past decade, become the de-facto online bus-ticketing brand in Bangladesh, proving conclusively that intercity travellers will book online and pay digitally when given a usable interface. Intercity bus remains the country's primary long-haul passenger mode, with tens of millions of tickets sold annually across hundreds of private operators. Shohoz's success, however, is a marketplace success — it aggregates inventory and charges operators per-ticket commission. That leaves a clear gap: a vertical, product-first platform that an operator or investor can own, brand, and run without per-ticket leakage. The consolidation around Shohoz also makes the timing favourable; operators are actively seeking owned digital channels that restore margin and direct customer relationships."
  )
);

// === 3. The Problem ===
children.push(h1("3. The Problem"));
children.push(
  body(
    "Three structural pain points define the current market. First, operators listing on Shohoz-like marketplaces surrender 8–15% per ticket in commission and lose direct access to their own customer data, weakening their brand and lifetime-value economics. Second, passengers can book online but cannot see where their bus actually is — they still call the counter to ask, generating support load, missed departures, and no-shows that hurt both sides. Third, operators cannot add a route, open a counter, deploy a bus, or adjust pricing without marketplace approval, slowing commercial agility. The net effect is revenue leakage, repeated service cost, and an operator class that is digitally dependent rather than digitally empowered."
  )
);

// === 4. The Solution — BusLine ===
children.push(h1("4. The Solution — BusLine"));
children.push(
  body(
    "BusLine is a custom-built platform delivered as a complete, owned codebase. The passenger web app provides route search, a live seat map, a simulated payment gateway (bKash, Nagad, card, cash-at-counter), and instant e-ticket confirmation. The real-time tracking layer uses WebSockets to push a live map showing the bus's current counter, next stop, ETA, and speed — closing the visibility gap that drives support calls. The owner dashboard lets non-technical staff add buses, build routes with ordered counters, schedule trips, set per-seat pricing, and push live location updates that passengers see instantly. The stack — Next.js, TypeScript, Prisma, Socket.IO — is modern and maintainable, with full source code, documentation, and operator training handed over at completion."
  )
);

// === 5. Why Now & Differentiation ===
children.push(h1("5. Why Now & Differentiation"));
children.push(
  body(
    "Smartphone penetration in Bangladesh crossed 60% in 2024, mobile wallets (bKash, Nagad) are mainstream, and operators are actively seeking owned digital channels following Shohoz's consolidation. BusLine differentiates on three points: full source-code ownership with no per-ticket commission; white-label branding so the operator owns the customer relationship; and live counter-by-counter tracking — a feature Shohoz does not offer, attacking the segment's highest-cost service pain point."
  )
);

// === 6. Engagement Model & Next Steps ===
children.push(h1("6. Engagement Model & Next Steps"));
children.push(
  body(
    "The engagement is structured as a one-time custom build: a one-week scoping workshop, an eight-to-ten-week build phase, a four-week pilot with one operator, and a formal handover with source code, documentation, and operator training. Commercial terms will be agreed in a follow-up meeting tailored to your portfolio thesis. We propose a 45-minute deep-dive to walk you through a working prototype and refine the scope. Please contact BusLine at hello@busline.example to schedule."
  )
);

// ---- Document ----
const doc = new Document({
  creator: "BusLine",
  title: "BusLine — Commercial Proposal",
  description: "Custom-build proposal for a bus ticketing & live-tracking platform",
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
                new TextRun({
                  text: "BusLine  ·  Commercial Proposal",
                  size: 18, // 9pt
                  color: c(P.muted),
                  font: FONT_HEAD,
                }),
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
                new TextRun({
                  children: [PageNumber.CURRENT],
                  size: 18,
                  color: c(P.muted),
                  font: FONT_BODY,
                }),
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
const outPath = path.join(outDir, "BusLine-Commercial-Proposal.docx");

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log("Wrote:", outPath);
  console.log("Size:", buf.length, "bytes");
});
