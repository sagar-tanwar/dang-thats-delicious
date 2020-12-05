const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const crypto = require('crypto');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', {
	failureRedirect: '/login',
	failureFlash: 'Failed Login!',
	successRedirect: '/',
	successFlash: 'You are now logged in'
});

exports.logout = (req, res) => {
	req.logout();
	req.flash('success', 'You are now logged out');
	res.redirect('/');
}

exports.isLoggedIn = (req, res, next) => {
	if(req.isAuthenticated()) return next();

	req.flash('error', 'You must be logged in to use that!');
	res.redirect('/login');
}

exports.forgot = async (req, res) => {
	// 1. see if a user with that email exists
	const user = await User.findOne({ email: req.body.email });
	if(!user) {
		req.flash('error', 'There is no user with that email');
		return res.redirect('/login');
	}

	// 2. generate reset token and token expiry date
	user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
	user.resetPasswordExpires = Date.now() + 3600000;
	await user.save();

	// 3. send an email
	const resetLink = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
	await mail.send({
		user,
		filename: 'password-reset',
		subject: 'Reset Password',
		resetLink,
	});

	// 4. redirect to the login page
	req.flash('success', 'An reset link has been emailed to you! ' + resetLink );
	res.redirect('/login');
}

exports.reset = async (req, res) => {
	const user = await User.findOne({
		resetPasswordToken: req.params.token,
		resetPasswordExpires: { $gt: Date.now() }
	});

	if(!user) {
		req.flash('error', 'Opps! Either token is invalid or has been expired');
		res.redirect('/login');
	}

	res.render('reset', { title: 'Reset Password' });
}

exports.confirmedPasswords = (req, res, next) => {
	if(req.body.password === req.body['password-confirm']) return next();

	req.flash('error', 'Passwords don\'t match');
	res.redirect('back');
}

exports.update = async (req, res) => {
	const user = await User.findOne({
		resetPasswordToken: req.params.token,
		resetPasswordExpires: { $gt: Date.now() }
	});

	if(!user) {
		req.flash('error', 'Opps! Either token is invalid or has been expired');
		res.redirect('/login');
	}

	// if the token is valid update the password
	const setPassword = promisify(user.setPassword, user);
	await setPassword(req.body.password);
	
	// to remove the token and expiry date just set them to undefined and they will be romed from the db
	user.resetPasswordToken = undefined;
	user.resetPasswordExpires = undefined;
	const updatedUser = await user.save();

	// Automatically login the user
	await req.login(updatedUser);
	req.flash('success', 'Congrats! You have successfully reset your password!');
	res.redirect('/');
}