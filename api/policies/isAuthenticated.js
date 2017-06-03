import http from 'http';
import passport from 'passport';

/* global _ User */
export default (req, res, next) => {
  const sails = req._sails;

  const returnUnauthenticated = () => {
    // Set status code
    res.statusCode = 401;

    if (sails.config.simpleauth.isNotAuthenticatedMessage) {
      const error = new Error(sails.config.simpleauth.isNotAuthenticatedMessage);
      error.code = 'E_AUTHORIZATION';
      return res.forbidden(error);
    }

    if (req.isSocket) return res.forbidden();

    return res.redirect(sails.config.simpleauth.isNotAuthenticatedRedirect);
  };

  const isAuthenticated = () => {
    // Check if user logged in
    if (req.isAuthenticated()) {
      req.session._garbage = Date();
      req.session.touch();

      // Check if user still exists
      return User.count(req.user.id).exec((userErr, userFound) => {
        if (userErr) return res.serverError(userErr);

        // If user still exists and user is not blocked, next...
        if (
          userFound &&
          req.user.blocked === false) {
          return next();
        }

        // Otherwise logout
        req.logout();

        // User is unauthenticated
        return returnUnauthenticated();
      });
    }

    // User is unauthenticated
    return returnUnauthenticated();
  };

  if (req.isSocket) {
    if (
      req.session &&
      req.session.passport &&
      req.session.passport.user
    ) {
      _.extend(req, _.pick(http.IncomingMessage.prototype, 'login', 'logIn', 'logout', 'logOut', 'isAuthenticated', 'isUnauthenticated'));

      return passport.initialize()(req, res, () => {
        passport.session()(req, res, () => isAuthenticated());
      });
    }

    // User is unauthenticated
    return returnUnauthenticated();
  }

  return isAuthenticated();
};
