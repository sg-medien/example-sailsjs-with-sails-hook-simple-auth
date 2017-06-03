/**
 * 400 (Bad Request) Handler
 *
 * Usage:
 * return res.badRequest();
 * return res.badRequest(data);
 * return res.badRequest(data, 'some/specific/badRequest/view');
 *
 * e.g.:
 * ```
 * return res.badRequest(
 *   'Please choose a valid `password` (6-12 characters)',
 *   'trial/signup'
 * );
 * ```
 */

import { simpleApi } from 'sails-hook-simple-api';

/* global _ */
module.exports = function badRequest(data, options) {

  // Get access to `req`, `res`, & `sails`
  var req = this.req;
  var res = this.res;
  var sails = req._sails;

  // Set status code
  res.status(400);

  // Log error to console
  if (data !== undefined) {
    sails.log.verbose('Sending 400 ("Bad Request") response: \n', data);
  }
  else sails.log.verbose('Sending 400 ("Bad Request") response');

  // Return data
  let returnData = {};

  // Set status in return
  returnData.status = res.statusCode;

  if (data && data instanceof Error) {
    returnData.code = data.code ? data.code : 'E_UNKNOWN';
    returnData.error = (data.originalError && _.isString(data.originalError)) ? data.originalError : data.message;

    if (data.code === 'E_VALIDATION') {
      res.status(422);
      returnData.status = res.statusCode;
      returnData.error = 'Validation failed.';
      returnData.errors = [];

      if (data.invalidAttributes && _.isObject(data.invalidAttributes) && _.size(data.invalidAttributes) && (data.model || req.options.controller)) {
        // Try to get current model
        const Model = data.model ? simpleApi.modelGetByRequest(req, data.model) : simpleApi.modelGetByRequest(req, req.options.controller);

        // Try to get individual validation messages
        let validationMessages = {};
        if (Model && Model.identity &&
          sails.models[Model.identity] &&
          _.isObject(sails.models[Model.identity].validationMessages)
        ) {
          validationMessages = sails.models[Model.identity].validationMessages;
        }

        _.forEach(data.invalidAttributes, (errors, field) => {
          _.forEach(errors, (error, errorName) => {
            if (error.rule && error.message && validationMessages[field] && validationMessages[field][error.rule]) {
              errors[errorName].message = validationMessages[field][error.rule].replace(/%%value%%/i, req.param(field));
            }
          });

          returnData.errors.push({
            field,
            messages: errors,
          });
        });
      }
    } else if (data.code === 'E_AUTHORIZATION') {
      res.status(401);
      returnData.status = res.statusCode;
    }

    returnData.extended = {
      failedTransactions: data.failedTransactions,
      details: data.details,
      rawStack: data.rawStack,
      stack: data.stack,
      _e: data._e,
    };
  } else {
    returnData = data;
  }

  // Only include errors in response if application environment
  // is not set to 'production'.  In production, we shouldn't
  // send back any identifying information about errors.
  if (sails.config.environment === 'production' && sails.config.keepResponseErrors !== true) {
    delete returnData.extended;
  }

  // If the user-agent wants JSON, always respond with JSON
  // If views are disabled, revert to json
  if (req.wantsJSON || sails.config.hooks.views === false) {
    return res.jsonx(returnData);
  }

  // If second argument is a string, we take that to mean it refers to a view.
  // If it was omitted, use an empty object (`{}`)
  options = (typeof options === 'string') ? { view: options } : options || {};

  // Attempt to prettify data for views, if it's a non-error object
  var viewData = data;
  if (!(viewData instanceof Error) && 'object' == typeof viewData) {
    try {
      viewData = require('util').inspect(data, {depth: null});
    }
    catch(e) {
      viewData = undefined;
    }
  }

  // If a view was provided in options, serve it.
  // Otherwise try to guess an appropriate view, or if that doesn't
  // work, just send JSON.
  if (options.view) {
    return res.view(options.view, { data: viewData, title: 'Bad Request' });
  }

  // If no second argument provided, try to serve the implied view,
  // but fall back to sending JSON(P) if no view can be inferred.
  else return res.guessView({ data: viewData, title: 'Bad Request' }, function couldNotGuessView () {
    return res.jsonx(returnData);
  });

};
