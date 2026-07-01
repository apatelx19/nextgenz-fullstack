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

        // 1. Header & Branding
        doc.fillColor('#FF4D00')
           .fontSize(28)
           .font('Helvetica-Bold')
           .text('NextGenZ Tech', { align: 'center' });
           
        doc.moveDown(0.5);
        
        doc.fillColor('#444444')
           .fontSize(12)
           .font('Helvetica')
           .text('Empowering the Next Generation of Developers', { align: 'center' });
           
        doc.moveDown(2);
        
        // Separator line
        doc.moveTo(50, doc.y)
           .lineTo(545, doc.y)
           .strokeColor('#FF4D00')
           .lineWidth(2)
           .stroke();

        doc.moveDown(2);

        // 2. Date & Salutation
        const currentDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        });
        
        doc.fillColor('#333333')
           .fontSize(11)
           .text(`Date: ${currentDate}`, { align: 'right' });
           
        doc.moveDown(2);
        
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('OFFER OF INTERNSHIP', { align: 'center', underline: true });
           
        doc.moveDown(2);
        
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text(`Dear ${applicationData.fullName},`);
           
        doc.moveDown(1);
        
        // 3. Body Text
        doc.font('Helvetica')
           .lineGap(5)
           .text(`We are thrilled to offer you an internship position at NextGenZ Tech in the domain of `)
           .font('Helvetica-Bold')
           .text(`${applicationData.domain}`, { continued: true })
           .font('Helvetica')
           .text(`. Your application and profile demonstrated the passion and potential we look for in our team members.`);
           
        doc.moveDown(1);
        
        const durationText = applicationData.plan === '199' ? '1 Month' : applicationData.plan === '499' ? '3 Months' : applicationData.plan;
        
        doc.text(`This internship program is designed to span a duration of `)
           .font('Helvetica-Bold')
           .text(`${durationText}`, { continued: true })
           .font('Helvetica')
           .text(`. During this time, you will work on real-world projects, gain hands-on experience, and be mentored by our expert team. Your expected start date will be communicated to you shortly.`);
           
        doc.moveDown(1);
        
        doc.text('We expect you to abide by all the company rules, maintain confidentiality of our projects, and exhibit professional behavior throughout your tenure.');

        doc.moveDown(2);
        
        doc.text('We are excited to welcome you to the NextGenZ Tech family and look forward to working with you!');

        doc.moveDown(3);
        
        // 4. Signatory
        doc.font('Helvetica-Bold')
           .text('Sincerely,');
           
        doc.moveDown(1.5);
        
        doc.font('Helvetica-Bold')
           .fillColor('#FF4D00')
           .text('NextGenZ Tech Team');
           
        doc.fillColor('#444444')
           .font('Helvetica')
           .fontSize(10)
           .text('Administration & HR Department');

        // Finalize the PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = new OfferLetterService();
