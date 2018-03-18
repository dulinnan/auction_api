"use strict";

/**
 * routes for the /auctions endpoints
 */
 const
     auctions = require('../controllers/auctions.controller'),
     auth = require('../lib/middleware'),
     bodyParser = require('body-parser'),
     rawParser = bodyParser.raw({type: 'image/*', limit: '16mb'}), // limit based on max size of MEDIUMBLOB from https://dev.mysql.com/doc/refman/5.5/en/storage-requirements.html#id899830
     jsonParser = bodyParser.json();

module.exports = (router) => {
  router.route('/auctions')
  .get(auctions.list)
  .post(auth.isAuthenticated, jsonParser, auctions.create);

  router.route('/auctions/:id')
  .get(auth.isValidAuction, auctions.read)
  .patch(auth.isValidAuction, auth.isAuthenticated, auth.isAuctionOwner, jsonParser, auctions.update);

  router.route('/auctions/:id/bids')
  .get(auctions.readBids)
  .post(auth.isValidAuction, auth.isAuthenticated, auth.isNotAuctionOwner, auctions.addBids);

  router.route('/auctions/:id/photos')
  .get()
  .post();

  router.route('/auctions/:auctionId/photos/:photoId')
  .get()
  .put()
  .delete();
};
