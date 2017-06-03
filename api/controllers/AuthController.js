/**
 * AuthController
 *
 * @description :: Server-side logic for managing the authentication
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

import http from 'http';
import passport from 'passport';

/* global _ */
export default {
  login(req, res) {
    const authenticate = () => {
      passport.authenticate('local', (err, user, info) => {
        if (err) return res.serverError(err);

        return req.login(user, (innerErr) => {
          if (innerErr) {
            innerErr.code = 'E_AUTHORIZATION';
            innerErr.message = info.message;
            if (info.message === 'Missing credentials') {
              innerErr.message += '.';
            }
            return res.badRequest(innerErr);
          }

          // Remember me?
          if (req.param('rememberme')) {
            req.session.cookie.expires = false;
          }

          return res.ok(user);
        });
      })(req, res);
    };

    // If socket request
    if (req.isSocket) {
      _.extend(req, _.pick(http.IncomingMessage.prototype, 'login'));

      return passport.initialize()(req, res, () => {
        passport.session()(req, res, () => authenticate());
      });
    }

    // Authenticate default request
    return authenticate();
  },

  logout(req, res) {
    if (req.isSocket) {
      _.extend(req, _.pick(http.IncomingMessage.prototype, 'logout'));
    }

    req.logout();
    return res.ok();
  },
};
