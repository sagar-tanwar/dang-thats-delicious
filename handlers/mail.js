const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
const juice = require('juice');
const promisify = require('es6-promisify');

const transporter = nodemailer.createTransport({
  host: process.env.HOST,
  port: process.env.PORT,
  secure: false,
  auth: {
    user: process.env.USER,
    pass: process.env.PASS
  }
});

const generateHTML = (filename, options = {}) => {
  const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`);
  return juice(html); // convert the styles to inline styles
}

exports.send = async (options) => {

  const html = generateHTML(options.filename, options);
  const text = htmlToText.fromString(html);

  const mailOptions = {
    from: 'Sagar Tanwar <noreply@sagar.com>',
    to: options.user.email,
    subject: options.subject,
    html,
    text
  }

  return transporter.sendMail(mailOptions);
}