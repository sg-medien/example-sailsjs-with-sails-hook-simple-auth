/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.bootstrap.html
 */

/* global sails SystemService  */
export default {
  bootstrap(cb) {
    sails.on('lifted', () => {
      SystemService.start().then(() => {
        sails.log.info('System ready!');
      }).catch((err) => {
        sails.log.error(err.message);
        sails.log.error('System not ready! Resolve all errors and restart the system!');
        sails.lower();
      });
    });

    sails.on('lower', () => {
      SystemService.shutdown().catch((err) => {
        sails.log.error(err.message);
      });
    });

    // It's very important to trigger this callback method when you are finished
    // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
    cb();
  },
};
