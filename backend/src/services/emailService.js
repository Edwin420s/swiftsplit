const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendPaymentNotification(toEmail, paymentData) {
    const subject = 'Payment Received - SwiftSplit';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2F4F4F;">Payment Received</h2>
        <p>Hello,</p>
        <p>You have received a payment of <strong>${paymentData.amount} USDC</strong>.</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>From:</strong> ${paymentData.payer}</p>
          <p><strong>Description:</strong> ${paymentData.description}</p>
          <p><strong>Transaction Hash:</strong> ${paymentData.transactionHash}</p>
        </div>
        <p>Thank you for using SwiftSplit!</p>
      </div>
    `;

    return this.sendEmail(toEmail, subject, html);
  }

  async sendTeamPaymentNotification(emails, paymentData) {
    const subject = 'Team Payment Processed - SwiftSplit';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2F4F4F;">Team Payment Processed</h2>
        <p>Hello Team Member,</p>
        <p>A team payment of <strong>${paymentData.totalAmount} USDC</strong> has been processed and split among team members.</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Your Share:</strong> ${paymentData.userAmount} USDC</p>
          <p><strong>Description:</strong> ${paymentData.description}</p>
          <p><strong>Transaction Hash:</strong> ${paymentData.transactionHash}</p>
        </div>
        <p>Thank you for using SwiftSplit!</p>
      </div>
    `;

    const emailPromises = emails.map(email => this.sendEmail(email, subject, html));
    return Promise.all(emailPromises);
  }

  async sendEmail(to, subject, html) {
    try {
      const info = await this.transporter.sendMail({
        from: `"SwiftSplit" <${process.env.SMTP_FROM}>`,
        to,
        subject,
        html,
      });

      console.log('Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();