import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

interface CertificateData {
  certificateNumber: string;
  studentName: string;
  courseName: string;
  issuedAt: Date;
  verifyUrl: string;
}

const BRAND_PINK = rgb(0.831, 0.176, 0.514); // hsl(330 81% 60%) — matches site theme
const NAVY = rgb(0.086, 0.106, 0.157);

export async function renderCertificatePdf(data: CertificateData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();

  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);

  // Border
  page.drawRectangle({
    x: 24, y: 24, width: width - 48, height: height - 48,
    borderColor: BRAND_PINK, borderWidth: 3,
  });
  page.drawRectangle({
    x: 34, y: 34, width: width - 68, height: height - 68,
    borderColor: NAVY, borderWidth: 1,
  });

  const centerText = (text: string, y: number, font = regular, size = 14, color = NAVY) => {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - w) / 2, y, size, font, color });
  };

  centerText('CODEVERTEX AFRICA — DIGITIKA ACADEMY', height - 90, bold, 16, BRAND_PINK);
  centerText('Certificate of Completion', height - 130, bold, 30, NAVY);
  centerText('This certifies that', height - 190, regular, 14);
  centerText(data.studentName, height - 230, bold, 26, BRAND_PINK);
  centerText('has successfully completed the course', height - 265, regular, 14);
  centerText(data.courseName, height - 300, bold, 20, NAVY);

  centerText(
    `Issued ${data.issuedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    height - 360, regular, 12
  );
  centerText(`Certificate No. ${data.certificateNumber}`, height - 380, regular, 11);
  centerText(`Verify at ${data.verifyUrl}`, 60, regular, 10);

  return doc.save();
}
