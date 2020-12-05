const mongoose = require('mongoose');
const User = mongoose.model('User');

// Make normal callbacks, promise based
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
  res.render('login', { title: 'Login' });
}

exports.registerForm = (req, res) => {
  res.render('register', { title: 'Register' });
}

exports.validateRegister = (req, res, next) => {
  req.checkBody('name', 'You must supply a name!').notEmpty();
  req.sanitizeBody('name');
  req.checkBody('email', 'You must supply a valid email address!').isEmail();
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false
  });
  req.checkBody('password', 'Password can not be blank!').notEmpty();
  req.checkBody('password-confirm', 'Confirm Password can not be blank!').notEmpty();
  req.checkBody('password-confirm', 'Opps! Password doesn\'t match!').equals(req.body.password);

  const errors = req.validationErrors();
  if(errors) {
    req.flash('error', errors.map(err => err.msg));
    res.render('register', { title: 'Register', body: req.body, flashes: req.flash() });
    return;
  }

  next();

}

exports.register = async (req, res, next) => {
	const user = User({ email: req.body.email, name: req.body.name });
	const register = promisify(User.register, User);
	await register(user, req.body.password);
	next();
}

exports.account = (req, res) => {
  res.render('account', { title: 'Edit Your Account' });
}

exports.updateAccount = async (req, res) => {
	const update = { name: req.body.name, email: req.body.email };
	const user = await User.findOneAndUpdate({ _id: req.user._id }, { $set: update }, {
		new: true, // to return the updated user object
		runValidator: true, // to run validation on the updated data
		context: 'query' // required for mongoose to work properly
	});	
	
	req.flash('success', 'Your account has been updated');
	res.redirect('back'); // to redirect on the previous page
}