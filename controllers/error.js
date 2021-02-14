exports.get404 = (req, res, next) => {
   res.status(404).render('404', {
      pageTitle: 'Page Not Found',
      path: '/404',
      isAuthenicated: req.session.isLoggedIn
   });
}

exports.get500 = (req, res, next) => {
   res.status(505).render('505', {
      pageTitle: 'Error!',
      path: '/500',
      isAuthenicated: req.session.isLoggedIn
   });
}