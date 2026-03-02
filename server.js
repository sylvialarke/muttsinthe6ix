import express from 'express';
import cors from 'cors';
import { mkdirSync, existsSync, createWriteStream, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import SVGtoPDF from 'svg-to-pdfkit';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:5173',
  'https://sylvialarke.github.io',
];
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (e.g. curl, Postman during local dev)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json({ limit: '10mb' }));

// Simple rate limiter — max 10 submissions per IP per minute
const rateLimits = new Map();
function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const max = 10;
  const recent = (rateLimits.get(ip) || []).filter(t => now - t < windowMs);
  recent.push(now);
  rateLimits.set(ip, recent);
  if (recent.length > max) return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  next();
}

const attendees = new Map();
const checkedIn = [];
const sseClients = new Set();

// Persistent attendee counter
const counterFile = join(__dirname, 'counter.json');
let totalAttendees = 1122; // base offset — first real check-in becomes #1,123
try {
  totalAttendees = JSON.parse(readFileSync(counterFile, 'utf8')).count;
} catch {
  writeFileSync(counterFile, JSON.stringify({ count: totalAttendees }));
}

app.get('/api/attendee-count', (req, res) => {
  res.json({ count: totalAttendees });
});

app.get('/api/checked-in', (req, res) => {
  res.json(checkedIn);
});

app.get('/api/checked-in/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send current list immediately on connect
  res.write(`data: ${JSON.stringify(checkedIn)}\n\n`);

  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

app.post('/api/attendees', rateLimit, (req, res) => {
  totalAttendees += 1;
  writeFileSync(counterFile, JSON.stringify({ count: totalAttendees }));
  attendees.set(req.body.email, { ...req.body, attendeeNumber: totalAttendees });
  res.json({ success: true, attendeeNumber: totalAttendees });
});

app.post('/api/sign-waiver', rateLimit, (req, res) => {
  const { email, signature_svg, furniture_acknowledged } = req.body;

  const attendee = attendees.get(email);
  if (!attendee) return res.status(404).json({ error: 'Attendee not found' });

  const waiversDir = join(__dirname, 'waivers');
  if (!existsSync(waiversDir)) mkdirSync(waiversDir);

  const signedAt = new Date();
  const date = signedAt.toISOString().split('T')[0];
  const safeName = `${attendee.first_name}_${attendee.last_name}`.replace(/[^a-zA-Z0-9_]/g, '');
  const filename = `${date}_${safeName}.pdf`;
  const filepath = join(waiversDir, filename);

  const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
  const stream = createWriteStream(filepath);
  doc.pipe(stream);

  // Header
  doc.fontSize(18).font('Helvetica-Bold').text('MUTTS IN THE 6IX', { align: 'center' });
  doc.fontSize(13).font('Helvetica').text('Release of Liability & Waiver', { align: 'center' });
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
  doc.moveDown(0.8);

  // Attendee details
  doc.fontSize(11).font('Helvetica-Bold').text('Attendee Information');
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(10);
  doc.text(`Name: ${attendee.first_name} ${attendee.last_name}`);
  doc.text(`Email: ${attendee.email}`);
  doc.text(`Bringing a dog: ${attendee.has_dog ? 'Yes' : 'No'}`);
  if (attendee.has_dog) {
    doc.text(`DA2PP Vaccine: ${attendee.da2pp_vaccine ? 'Confirmed' : 'Not confirmed'}`);
    doc.text(`Rabies Vaccine: ${attendee.rabies_vaccine ? 'Confirmed' : 'Not confirmed'}`);
    doc.text(`Bordetella Vaccine: ${attendee.bordetella_vaccine ? 'Confirmed' : 'Not confirmed'}`);
  }
  doc.text(`Furniture responsibility acknowledged: ${furniture_acknowledged ? 'Yes' : 'No'}`);
  doc.moveDown(0.8);
  doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
  doc.moveDown(0.8);

  // Waiver text
  doc.fontSize(11).font('Helvetica-Bold').text('RELEASE OF LIABILITY, WAIVER OF CLAIMS, ASSUMPTION OF RISKS, AND INDEMNITY AGREEMENT');
  doc.moveDown(0.4);
  doc.font('Helvetica').fontSize(9);

  const waiverText = [
    'By agreeing to the terms of this document, you will waive or give up certain legal rights, including the right to sue for negligence or claim compensation following an accident or incident.',
    'TO: Mutts in the 6ix Ltd. and its directors, employees, vendors, representatives, volunteers, independent contractors, partnering venues, and assigns (hereinafter collectively referred to as the "Releasees"). The current and any future Mutts in the 6ix events are herein referred to as "the event."',
    'SECTION 1: ACKNOWLEDGEMENT OF RISKS\nI hereby waive any and all claims that I have or may have in the future against the Releasees and release them from any and all liability for any loss, damage, expense, or injury, including claims for contribution and indemnity or medical bills to my dog or myself arising from my attendance and participation in the event due to any cause whatsoever, including negligence and any duty of care owed to me by the Releasees.\n\nI understand that negligence includes failure on the part of the Releasees to take reasonable steps to safeguard or protect me from, or to warn me of, the risks, dangers, and hazards referred to below, including: pet-related injuries (e.g., bites, scratches), allergies, or other incidents; the risk of my dog ingesting harmful objects or substances; exposure to diseases or viruses; and slipping or falling.\n\nThese risks could result in personal injury to myself, my dog, or others. I acknowledge that any pet present may behave unpredictably, regardless of the owner\'s intent or training. I voluntarily assume all risks and waive any claims against the Releasees for injuries or damages that may occur during my visit.',
    'SECTION 2: PERSONAL RESPONSIBILITY\nI agree to be solely responsible for my dog during my visit to the event. I will ensure my dog adheres to the event\'s rules and guidelines. If my dog causes harm or damage, I agree to be responsible for any resulting financial consequences.',
    'SECTION 3: PHOTO/VIDEO RELEASE\nI hereby grant permission to Mutts in the 6ix and the Releasees to use photographs, video footage, and audio recordings of me and/or my dog taken during the event for marketing, promotional, and other business purposes.',
    'SECTION 4: RELEASE OF LIABILITY, WAIVER OF CLAIMS, AND INDEMNITY AGREEMENT\nIn consideration for being allowed to attend the event, I agree to release, indemnify, and hold harmless the Releasees from any and all liability for any harm to my dog or personal injury to myself. I understand the Releasees are not liable for any loss, theft, or damage to my personal belongings.',
    'SECTION 5: LEGAL AGREEMENTS\nBy signing this Release Agreement, I am waiving certain legal rights, including the right to sue. I agree to indemnify and hold harmless the Releasees from any liability or claims arising from my participation in the event. This Release Agreement shall be effective and binding upon me, my heirs, executors, and assigns, and shall be governed by the laws of Ontario, Canada.',
  ];

  for (const para of waiverText) {
    doc.text(para, { paragraphGap: 5 });
    doc.moveDown(0.4);
  }

  doc.moveDown(0.4);
  doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
  doc.moveDown(0.8);

  // Signature
  doc.fontSize(11).font('Helvetica-Bold').text('Signature');
  doc.moveDown(0.4);

  if (signature_svg) {
    try {
      let svgContent = signature_svg;
      if (svgContent.startsWith('data:image/svg+xml;base64,')) {
        svgContent = Buffer.from(svgContent.replace('data:image/svg+xml;base64,', ''), 'base64').toString('utf8');
      } else if (svgContent.startsWith('data:image/svg+xml,')) {
        svgContent = decodeURIComponent(svgContent.replace('data:image/svg+xml,', ''));
      }
      SVGtoPDF(doc, svgContent, 50, doc.y, { width: 300, height: 80, preserveAspectRatio: 'xMinYMin meet' });
      doc.moveDown(5);
    } catch (e) {
      doc.font('Helvetica').fontSize(9).text('[Signature on file]');
      doc.moveDown(0.5);
    }
  }

  doc.fontSize(9).font('Helvetica').text(`Signed on: ${signedAt.toLocaleString('en-CA', { timeZone: 'America/Toronto' })} (Eastern Time)`);

  doc.end();

  stream.on('finish', () => {
    checkedIn.push({
      first_name: attendee.first_name,
      last_name: attendee.last_name,
      has_dog: attendee.has_dog,
      dog_name: attendee.dog_name || null,
      checked_in_at: signedAt.toISOString(),
    });
    for (const client of sseClients) {
      client.write(`data: ${JSON.stringify(checkedIn)}\n\n`);
    }
    attendees.delete(email);
    console.log(`Waiver saved: ${filename}`);
    res.json({ success: true, filename });
  });

  stream.on('error', (err) => {
    console.error('PDF write error:', err);
    res.status(500).json({ error: 'Failed to save waiver' });
  });
});

app.listen(PORT, () => {
  console.log(`Waiver server running on http://localhost:${PORT}`);
  console.log(`Waivers will be saved to: ${join(__dirname, 'waivers')}`);
});
