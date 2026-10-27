// Commercial Proposal — BusLine Custom Build Engagement (v2)
// Aligned with the BusLine app design (emerald + amber "highway" palette).
// Body covers ONLY: (1) the 3 core features the client specified at the outset,
// (2) what is already built & working in the prototype, (3) what's on the roadmap.
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
  BorderStyle,
} = require("docx");
const fs = require("fs");
const path = require("path");

// ---- Palette (aligned with BusLine app: emerald primary + amber accent) ----
const P = {
  primary: "#0F7050",   // emerald — matches app --primary
  accent:  "#B7791F",   // amber   — matches app --accent
  body:    "#1A1A1A",   // near-black
  muted:   "#5A6B5E",   // muted green-grey
};
const c = (hex) => hex.replace("#", "");

// ---- Font profile (Formal — Profile A) ----
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

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 220, after: 100, line: 320 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 26, // 13pt
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

// Body paragraph with inline bold lead-in (for labelled list items).
function bodyLead(lead, rest) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: 120 },
    children: [
      new TextRun({
        text: lead,
        bold: true,
        size: 24,
        color: c(P.primary),
        font: FONT_BODY,
      }),
      new TextRun({
        text: rest,
        size: 24,
        color: c(P.body),
        font: FONT_BODY,
      }),
    ],
  });
}

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
        text: "BusLine — Online Ticketing, Owner-Managed Routes & Live Bus Tracking",
        bold: true,
        size: 36, // 18pt — slightly smaller to fit one line
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
        size: 24,
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
    "BusLine is a custom-built intercity bus ticketing platform centred on three capabilities specified at the outset: passengers can see available trips and buy tickets online through a payment gateway; the website owner can add tickets, routes, and all supporting information from a self-serve dashboard; and every active bus is tracked live on the road, with passengers able to see exactly which counter it is currently at. This proposal outlines what is already built and working, the features intended next, and the engagement model for delivering the production system."
  )
);

// === 2. Core Capabilities ===
children.push(h1("2. Core Capabilities"));

children.push(h2("2.1  Online Ticketing with Payment Gateway"));
children.push(
  body(
    "Passengers search by origin, destination, and date; see all matching trips with bus type, departure time, fare, and remaining seats; pick seats on a live seat map that flags already-booked seats in real time; and pay through a payment gateway supporting card, bKash, Nagad, and cash-at-counter. Each successful payment produces an instant e-ticket with booking ID, seat numbers, boarding counter, and total paid, retrievable later by email or phone from the My Bookings page."
  )
);

children.push(h2("2.2  Owner-Managed Tickets, Routes & Buses"));
children.push(
  body(
    "The owner dashboard lets non-technical staff add a bus (plate, seat count, type, driver), build a route with its ordered counters and addresses, and schedule a trip by combining a bus with a route, departure/arrival times, and per-seat price. Every trip created this way becomes immediately visible to passengers on the search page — no developer involvement, no marketplace approval, no per-ticket commission to a third party."
  )
);

children.push(h2("2.3  Live Bus Tracking — Road Position & Current Counter"));
children.push(
  body(
    "Each active trip broadcasts its position over WebSockets to every passenger currently tracking it. The passenger view shows the bus moving along the route's counters on a live map, the counter it has just passed or is currently stopped at, the next counter it is heading to, the ETA to that next counter, current speed, and overall trip progress as a percentage. A full route timeline lists every counter with passed/upcoming status, so passengers always know exactly where the bus is and when it will reach them."
  )
);

// === 3. Built & Working Today ===
children.push(h1("3. Built & Working Today"));
children.push(
  body(
    "A working prototype of all three core capabilities is already running. Passenger side: trip search and listing, visual seat-map selection, simulated payment gateway with confirmation, and a My Bookings lookup page. Tracking side: a live tracking page with route map, current/next counter, ETA, speed, progress bar, and full counter timeline — all real-time via WebSockets. Owner side: an admin dashboard with KPI cards (revenue, tickets sold, active buses, routes), a revenue-by-route chart, full management screens for trips, routes, and buses, and a tracking-control panel where the owner advances the bus counter-by-counter or sets fine-grained progress, with every update pushed live to passengers. The stack — Next.js, TypeScript, Prisma, Socket.IO — is modern, maintainable, and owned outright."
  )
);

// === 4. Roadmap — What Comes Next ===
children.push(h1("4. Roadmap — What Comes Next"));
children.push(
  body(
    "The next build phase adds: real GPS device integration so each bus self-reports its position instead of being advanced manually; SMS and email notifications for booking confirmation, departure reminders, and delay alerts; QR-code boarding passes scannable by the conductor; a refund and cancellation flow with automatic seat release; native iOS and Android apps; and an analytics module covering revenue, route performance, and no-show tracking. Each module plugs into the existing architecture without rework."
  )
);

// === 5. Engagement Model & Next Steps ===
children.push(h1("5. Engagement Model & Next Steps"));
children.push(
  body(
    "The engagement is a one-time custom build: a one-week scoping workshop, an eight-to-ten-week build phase to take the prototype to production, a four-week pilot, and a handover with source code, documentation, and operator training. Commercial terms will be agreed in a follow-up meeting. We propose a 45-minute deep-dive to walk you through the working prototype and refine the scope. Contact BusLine at hello@busline.example to schedule."
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
                  size: 18,
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
