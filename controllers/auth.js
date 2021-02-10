const User = require('../models/user');

// Encryption
const bcrypt = require('bcryptjs');

// Mailer
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const transporter = nodemailer.createTransport(sendgridTransport({
   auth: {
    api_key: 'xxxxxxxxx'
   }
}));

exports.getLogin = (req, res, next) => {
   // const isLoggedIn = req.get('Cookie').split(';')[4].trim().split('=')[1] === 'true';
   let message = req.flash('error');
   if (message.length > 0) {
      message = message[0];
   } else {
      message = null;
   }
   res.render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: message
   });
}

exports.postLogin = (req, res, next) => {
   // res.setHeader('Set-Cookie', 'loggedIn=true'); // Expires, Max-Age, Domain, Secure, HttpOnly
   const email = req.body.email;
   const password = req.body.password;
   User.findOne({ email: email })
      .then(user => {
         if (!user) {
            req.flash('error', 'Invalid email or password.');
            return res.status(302).redirect('/login');
         }
         bcrypt.compare(password, user.password)
            .then(doMatch => {
               if (doMatch) {
                  req.session.isLoggedIn = true;
                  req.session.user = user;
                  return req.session.save(err => {
                     console.log(err);
                     res.status(302).redirect('/');
                  }); // session.save() is not always needed - here, ensures that session has been saved before redirecting
               }
               req.flash('error', 'Invalid email or password.');
               res.status(302).redirect('/login');
            })
            .catch(err => {
               console.log(err);
               res.status(302).redirect('/');
            });
      })
      .catch(err => console.log(err));
}

exports.postLogout = (req, res, next) => {
   req.session.destroy(err => {
      console.log(err);
      res.status(302).redirect('/');
   });
}

exports.getSignup = (req, res, next) => {
   let message = req.flash('error');
   if (message.length > 0) {
      message = message[0];
   } else {
      message = null;
   }
   res.render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: message
   })
}

exports.postSignup = (req, res, next) => {
   const email = req.body.email;
   const password = req.body.password;
   const confirmPassword = req.body.confirmPassword;

   User.findOne({ email: email })
      .then(userDoc => {
         if (userDoc) {
            req.flash('error', 'E-mail already exists.');
            return res.status(302).redirect('/signup');
         }
         return bcrypt.hash(password, 12)
            .then(hashedPassword => {
               const user = new User({
                  email: email,
                  password: hashedPassword,
                  cart: {
                     items: []
                  }
               });
               return user.save();
            })
            .then(result => {
               res.status(302).redirect('/login');
               return transporter.sendMail({
                  to: email,
                  from: 'xxxxxxxxx@gmail.com',
                  subject: 'Signup Succeeded',
                  html: '<h1>You successfully signed up</h1>'
               });
            })
            .catch(err => console.log(err));
      })
      .catch(err => console.log(err));
}