import Promise from 'bluebird';

/* global _ sails User */
const SystemService = {
  start() {
    const that = this;

    return new Promise((next, error) => {
      sails.log.info('Starting system...');

      return that.createInitialUsers().then(() => {
        sails.log.info('System started.');

        return next();
      }).catch(e => error(e));
    });
  },

  shutdown() {
    return new Promise((next) => {
      sails.log.info('Shutting down system...');

      return next();
    });
  },

  createInitialUsers() {
    return new Promise((next, error) => {
      sails.log.info('Creating initial users if necessary...');

      if (
        _.isUndefined(sails.config.initialUsers) ||
        !_.isArray(sails.config.initialUsers) ||
        !sails.config.initialUsers.length
      ) {
        return next();
      }

      const users = sails.config.initialUsers;

      return User.count().exec((countErr, found) => {
        if (countErr) return error(countErr);
        if (found) return next();

        return User.createEach(users).exec((userErr) => {
          if (userErr) return error(userErr);

          sails.log.info('Created successfully initial users.');

          return next();
        });
      });
    });
  },
};
export default SystemService;
