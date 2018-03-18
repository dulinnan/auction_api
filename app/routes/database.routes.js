"use strict";

/**
 * routes for the root endpoint
 *
 * currently just a db reset convenience method (but see /status in the main app module)
 */

const database = require('../controllers/database.controller');

module.exports = (router) => {

    router.route('/reset')
          .post(database.reset);

    router.route('/resample')
          .post(database.resample);

};
