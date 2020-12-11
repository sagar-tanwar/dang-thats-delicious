const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const validator = require('validator');
const md5 = require('md5');
const mongoodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: 'Please enter a name!',
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    required: 'Please enter an email!',
    trim: true,
    validate: [validator.isEmail, 'Please enter a valid email!']
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  hearts: [{ type: mongoose.Schema.ObjectId, ref: 'Store' }]
});

userSchema.virtual('gravatar').get(function () {
	const hash = md5(this.email);
	return `https://gravatar.com/avatar/${hash}?s=200`;
});

userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });
userSchema.plugin(mongoodbErrorHandler);

module.exports = mongoose.model('User', userSchema);