/**
 * Default model configuration
 * (sails.config.models)
 *
 * Unless you override them, the following properties will be included
 * in each of your models.
 *
 * For more info on Sails models, see:
 * http://sailsjs.org/#!/documentation/concepts/ORM
 */

/* global _ */
export default {
  models: {
    /* **************************************************************************
     *                                                                          *
     * Your app's default connection. i.e. the name of one of your app's        *
     * connections (see `config/connections.js`)                                *
     *                                                                          *
     ***************************************************************************/
    // connection: 'localDiskDb',

    /* **************************************************************************
     *                                                                          *
     * How and whether Sails will attempt to automatically rebuild the          *
     * tables/collections/etc. in your schema.                                  *
     *                                                                          *
     * See http://sailsjs.org/#!/documentation/concepts/ORM/model-settings.html *
     *                                                                          *
     ***************************************************************************/
    // migrate: 'alter',

    beforeCreate(values, next) {
      _.forEach(values, (value, valueIndex) => {
        if ((_.isString(value) && _.trim(value) === '') || _.isNaN(value)) {
          values[valueIndex] = null;
        }
      });

      return next();
    },

    beforeUpdate(values, next) {
      _.forEach(values, (value, valueIndex) => {
        if ((_.isString(value) && _.trim(value) === '') || _.isNaN(value)) {
          values[valueIndex] = null;
        }
      });

      return next();
    },
  },
};
