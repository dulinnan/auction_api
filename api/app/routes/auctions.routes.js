"use strict";

/**
 * routes for the /auctions endpoints
 */
 const
     projects = require('../controllers/auctions.controller'),
     middleware = require('../lib/middleware'),
     bodyParser = require('body-parser'),
     rawParser = bodyParser.raw({type: 'image/*', limit: '16mb'}), // limit based on max size of MEDIUMBLOB from https://dev.mysql.com/doc/refman/5.5/en/storage-requirements.html#id899830
     jsonParser = bodyParser.json();

module.exports = (router) => {
  router.route('/auctions')
  .get()
  .post();

  router.route('/auctions/:id')
  .get()
  .patch();

  router.route('/auctions/:id/bids')
  .get()
  .post();

  router.route('/auctions/:id/photos')
  .get()
  .post();

  router.route('/auctions/:auctionId/photos/:photoId')
  .get()
  .put()
  .delete();
};
