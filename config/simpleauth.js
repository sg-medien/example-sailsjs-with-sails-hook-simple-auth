import Local from 'passport-local';
import bcrypt from 'bcrypt-nodejs';
import moment from 'moment';

const bruteforceMaxLoginFailures = 3;
const bruteforceBlockMinutes = 1;

/* global User */
export default {
  simpleauth: {
    passport: {
      serializeUser(user, next) {
        next(null, user.id);
      },
      deserializeUser(data, next) {
        return User.findOne(data).exec((userErr, user) => {
          next(userErr, !user ? { id: data } : user);
        });
      },
      strategies: {
        local: {
          strategy: Local.Strategy,
          options: {
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true,
          },
          verify(req, usernameOrEmail, password, next) {
            return User.findOne({
              or: [
                { username: usernameOrEmail },
                { email: usernameOrEmail },
              ],
            }).exec((userErr, user) => {
              if (userErr) return next(userErr);

              if (!user) return next(null, false, { message: 'Wrong credentials.' });

              const lastFaultyLoginDiffMinutes = moment().diff(user.lastFaultyLogin) / 1000 / 60;
              if (user.loginFailures >= bruteforceMaxLoginFailures) {
                if (lastFaultyLoginDiffMinutes <= bruteforceBlockMinutes) {
                  return next(null, false, { message: 'Too often logged in incorrectly, the access has been blocked ' +
                  `for ${bruteforceBlockMinutes} minute${bruteforceBlockMinutes !== 1 ? 's' : ''}.` });
                }
                user.loginFailures = 0;
              }

              return bcrypt.compare(password, user.password, (passwordErr, match) => {
                if (passwordErr) return next(passwordErr);

                if (!match) {
                  // Update lastFaultyLogin and increase loginFailures
                  delete user.password;
                  user.lastFaultyLogin = new Date();
                  user.loginFailures += 1;
                  return user.save((saveErr) => {
                    if (saveErr) return next(saveErr);

                    return next(null, false, { message: 'Wrong credentials.' });
                  });
                }

                if (user.blocked === true) return next(null, false, { message: 'Your account has been blocked.' });

                // Remove password from response
                delete user.password;

                // Reset loginFailures
                user.loginFailures = 0;

                // Update lastValidLogin
                user.lastValidLogin = new Date();

                // Build user response
                const userResponse = user.toJSON();

                return user.save((saveErr) => {
                  if (saveErr) return next(saveErr);

                  return next(null, userResponse, { message: 'Login successful.' });
                });
              });
            });
          },
        },
      },
    },
    isNotAuthenticatedMessage: 'This resource is protected. Please authenticate (/login).',
  },
};
