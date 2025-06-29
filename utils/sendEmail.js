const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // Transporter yaradın
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // 587 üçün false, 465 üçün true
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

    // Email seçimləri
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'Job Board'} <${process.env.EMAIL_FROM}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

    // Email göndərin
    const info = await transporter.sendMail(mailOptions);
    console.log('Email göndərildi: ', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Email göndərmə xətası:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = sendEmail;