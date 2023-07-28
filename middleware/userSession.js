const userloggedoff = (req, res, next) => {
  try {
    if (req.session.login) {
      res.redirect('/home');
    } else {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Expires', '0');
      res.setHeader('Pragma', 'no-cache');
      next();
    }
  } catch (error) {
    console.log(error.message);
  }
};

const userloggedin = (req, res, next) => {
  try {
    if (req.session.login && req.session.user) {
      res.redirect('/home');
    } else {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Expires', '0');
      res.setHeader('Pragma', 'no-cache');
      next();
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  userloggedin,
  userloggedoff
};
