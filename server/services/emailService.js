const nodemailer = require('nodemailer');
require('dotenv').config({ path: '../.env' }); // Adjust path based on where it's called, but process.env should be loaded in app.js

// Import Templates
const pendingTemplate = require('../templates/pendingTemplate');
const underReviewTemplate = require('../templates/underReviewTemplate');
const shortlistedTemplate = require('../templates/shortlistedTemplate');
const interviewScheduledTemplate = require('../templates/interviewScheduledTemplate');
const selectedTemplate = require('../templates/selectedTemplate');
const rejectedTemplate = require('../templates/rejectedTemplate');
const adminNotificationTemplate = require('../templates/adminNotificationTemplate');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    this.companyName = process.env.COMPANY_NAME || 'NextGenZ Tech';
    this.companyEmail = process.env.COMPANY_EMAIL || 'admin@nextgenz.tech';
  }

  async sendEmail(to, subject, htmlContent) {
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️  Email skipped: Missing EMAIL_USER or EMAIL_PASS in environment variables.');
        return false;
      }

      const mailOptions = {
        from: `"${this.companyName}" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: htmlContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email Sent Successfully to ${to} | Timestamp: ${new Date().toISOString()}`);
      return true;
    } catch (error) {
      console.error(`❌ Email Failed to ${to} | Timestamp: ${new Date().toISOString()}`);
      console.error(error.message);
      return false;
    }
  }

  // Application Success Email (To Student)
  async sendApplicationSuccessEmail(applicationData) {
    const subject = `Application Received Successfully | ${this.companyName}`;
    const html = pendingTemplate(applicationData);
    return this.sendEmail(applicationData.email, subject, html);
  }

  // Admin Notification Email (To Admin)
  async sendAdminNotificationEmail(applicationData) {
    const subject = `New Internship Application Received - ${applicationData.fullName}`;
    const html = adminNotificationTemplate(applicationData);
    return this.sendEmail(this.companyEmail, subject, html);
  }

  // Central Status Update Email
  async sendStatusEmail(applicationData) {
    const status = applicationData.status;
    let subject = '';
    let html = '';

    switch(status) {
      case 'Pending':
        subject = `Application Received Successfully | ${this.companyName}`;
        html = pendingTemplate(applicationData);
        break;
      case 'Under Review':
        subject = `Your Application is Under Review | ${this.companyName}`;
        html = underReviewTemplate(applicationData);
        break;
      case 'Shortlisted':
        subject = `Congratulations! You have been Shortlisted | ${this.companyName}`;
        html = shortlistedTemplate(applicationData);
        break;
      case 'Interview Scheduled':
        subject = `Interview Scheduled | ${this.companyName}`;
        html = interviewScheduledTemplate(applicationData);
        break;
      case 'Selected':
        subject = `Congratulations! You have been Selected | ${this.companyName}`;
        html = selectedTemplate(applicationData);
        break;
      case 'Rejected':
        subject = `Application Update | ${this.companyName}`;
        html = rejectedTemplate(applicationData);
        break;
      default:
        return false;
    }

    return this.sendEmail(applicationData.email, subject, html);
  }
}

module.exports = new EmailService();
