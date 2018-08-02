const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
  res.render('login', {
    title: 'Login'
  });
}

exports.registerForm = (req, res) => {
  res.render('register', {
    title: 'Register'
  });
}

exports.validateRegister = (req, res, next) => {
  //the sanitizeBody and checkBody come from the app.js importing of express Validator library
  req.sanitizeBody('name');
  req.checkBody('name', 'Please supply a name.').notEmpty();
  req.checkBody('email', 'Please supply a valid email.').isEmail();
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false
  });
  req.checkBody('password', 'Please supply a password.').notEmpty();
  req.checkBody('confirm-password', 'Please supply a Confirmation Password.').notEmpty();
  req.checkBody('confirm-password', 'Your passwords do not match.').equals(req.body.password);

  const errors = req.validationErrors();
  if (errors) {
    req.flash('error', errors.map(err => err.msg));
    res.render('register', {
      title: 'Register',
      body: req.body,
      flashes: req.flash()
    });
    return;
  }

  next();
}

exports.register = async(req, res, next) => {
  const user = new User({
    email: req.body.email,
    name: req.body.name
  });
  //the User.register function comes from passportLocalMongoose
  const register = promisify(User.register, User);
  await register(user, req.body.password);
  next();
}
