const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'Job Portal'} <${process.env.EMAIL_FROM}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

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