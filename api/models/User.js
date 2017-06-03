/**
 * User.js
 *
 * @description :: Database model for managing users
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

import bcrypt from 'bcrypt-nodejs';

/* global _ */
export default {
  attributes: {
    username: {
      type: 'string',
      required: true,
      minLength: 3,
      maxLength: 30,
      regex: /^[a-z0-9\\._]+$/i,
      unique: true,
    },
    email: {
      type: 'string',
      required: true,
      email: true,
      unique: true,
    },
    password: {
      type: 'string',
      required: true,
      minLength: 6,
    },
    lastValidLogin: {
      type: 'datetime',
    },
    lastFaultyLogin: {
      type: 'datetime',
    },
    loginFailures: {
      type: 'integer',
    },
    blocked: {
      type: 'boolean',
      required: true,
      defaultsTo: false,
      index: true,
    },
    // Remove some fields in json responses
    toJSON() {
      const obj = this.toObject();
      delete obj.password;
      return obj;
    },
  },

  validationMessages: {
    username: {
      string: 'Username should be a string.',
      required: 'Username is required.',
      minLength: 'Create a username at least 3 characters long.',
      maxLength: 'Create a username at most 30 characters long.',
      regex: 'Usernames can only use letters, numbers, underscores and periods.',
      unique: 'Sorry, that username is already taken.',
    },
    email: {
      string: 'Email should be a string.',
      required: 'Email is required.',
      email: 'Provide a valid email.',
      unique: 'Another account is using %%value%%.',
    },
    password: {
      string: 'Password should be a string.',
      required: 'Password is required.',
      minLength: 'Create a password at least 6 characters long.',
    },
    lastValidLogin: {
      datetime: 'Last valid login should be a datetime.',
    },
    lastFaultyLogin: {
      datetime: 'Last faulty login should be a datetime.',
    },
    loginFailures: {
      integer: 'Login failures should be an integer.',
    },
    blocked: {
      boolean: 'User blocking status should be a boolean.',
      required: 'User blocking status is required.',
    },
  },

  // Encrypt password of the user after validate it
  afterValidate(values, next) {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) return next(err);

      if (_.isUndefined(values.password)) {
        return next();
      }

      return bcrypt.hash(values.password, salt, null, (innerErr, hash) => {
        if (innerErr) return next(innerErr);

        values.password = hash;
        return next();
      });
    });
  },
};
