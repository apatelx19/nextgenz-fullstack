const PDFDocument = require('pdfkit');

class OfferLetterService {
  /**
   * Generates a PDF offer letter and returns it as a Buffer
   * @param {Object} applicationData - The application details
   * @returns {Promise<Buffer>}
   */
  async generateOfferLetter(applicationData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers = [];

        // Collect data chunks
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });
        
        const path = require('path');
        const msmePath = path.join(__dirname, '../assets/msme_logo.png');
        const signaturePath = path.join(__dirname, '../assets/signature.png');
        const logoPath = path.join(__dirname, '../../client/website/assets/brand_logo.jpg');

        // ========== WATERMARK (drawn first so it sits behind everything) ==========
        doc.save();
        doc.translate(297, 421); // center of A4 page
        doc.rotate(-45);        // diagonal angle
        doc.fontSize(72)
           .font('Helvetica-Bold')
           .fillColor('#FF4D00')
           .opacity(0.06)
           .text('NextGenZ Tech', -250, -30, { align: 'center', width: 500 });
        doc.restore();
        doc.opacity(1); // reset opacity for all subsequent content

        // ========== 1. Header & Branding ==========
        
        // Company Logo (Top Left)
        try {
          doc.image(logoPath, 50, 35, { width: 50, height: 50 });
        } catch (e) {
          console.error("Missing brand logo", e);
        }

        doc.fillColor('#FF4D00')
           .fontSize(28)
           .font('Helvetica-Bold')
           .text('NextGenZ Tech', 110, 50, { align: 'left' });
           
        doc.moveDown(0.2);
        
        doc.fillColor('#444444')
           .fontSize(12)
           .font('Helvetica')
           .text('Empowering the Next Generation of Developers', 110, 85, { align: 'left' });
           
        // MSME Badge (Top Right)
        try {
          doc.image(msmePath, 400, 40, { width: 140 });
        } catch (e) {
          console.error("Missing MSME logo", e);
        }
           
        // Separator line
        doc.moveTo(50, 130)
           .lineTo(545, 130)
           .strokeColor('#FF4D00')
           .lineWidth(2)
           .stroke();

        doc.moveDown(2);

        // ========== 2. Date & Salutation ==========
        doc.y = 170;
        const currentDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        });
        
        doc.fillColor('#000000')
           .fontSize(11)
           .font('Helvetica-Bold')
           .text(`Date: ${currentDate}`, 50, doc.y, { align: 'left' });
           
        doc.moveDown(2);
        
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('INTERNSHIP OFFER LETTER', { align: 'center' });
           
        doc.moveDown(2);
        
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('To:');
        doc.text(`${applicationData.fullName}`);
           
        doc.moveDown(2);
        
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text(`Subject: Offer for the Position of ${applicationData.domain}`);
           
        doc.moveDown(2);
        
        doc.fontSize(12)
           .font('Helvetica')
           .text(`Dear ${applicationData.fullName},`);
           
        doc.moveDown(1.5);
        
        // ========== 3. Body Text ==========
        doc.font('Helvetica')
           .lineGap(5)
           .text(`We are thrilled to offer you an internship position at NextGenZ Tech in the domain of `)
           .font('Helvetica-Bold')
           .text(`${applicationData.domain}`, { continued: true })
           .font('Helvetica')
           .text(`. Your application and profile demonstrated the passion and potential we look for in our team members.`);
           
        doc.moveDown(1);
        
        doc.text(`This internship program is designed to span a duration of `)
           .font('Helvetica-Bold')
           .text(`1 Month`, { continued: true })
           .font('Helvetica')
           .text(`. During this time, you will work on real-world projects, gain hands-on experience, and be mentored by our expert team. Your expected start date will be communicated to you shortly.`);
           
        doc.moveDown(1);
        
        doc.text('We expect you to abide by all the company rules, maintain confidentiality of our projects, and exhibit professional behavior throughout your tenure.');

        doc.moveDown(2);
        
        doc.text('We are excited to welcome you to the NextGenZ Tech family and look forward to working with you!');

        doc.moveDown(3);
        
        const footerY = 700;
        
        // ========== 4. Footer Details (Left) ==========
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#000000')
           .text('+91 9313469100\nnextgenztech.admin@gmail.com', 50, footerY, { lineGap: 5 });
           
        // ========== 5. Signature (Right) ==========
        try {
          doc.image(signaturePath, 420, footerY - 40, { width: 100 });
        } catch (e) {
          console.error("Missing signature logo", e);
        }
        
        doc.font('Helvetica-Bold')
           .fontSize(12)
           .text('Patel Arya', 420, footerY + 20, { align: 'center', width: 100 });
           
        doc.font('Helvetica-Bold')
           .fontSize(10)
           .text('Ceo / Founder', 420, footerY + 35, { align: 'center', width: 100 });

        // Finalize the PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = new OfferLetterService();
