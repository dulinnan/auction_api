"use strict";

/**
 * various Express middleware functions for authentication and authorization of different forms
 */

const
    log = require('./logger')(),
    config = require('../../config/config.js'),
    users = require('../models/users.model'),
    auctions = require('../models/auctions.model');
    // photos = require('../models/photos.model');
    // bids = require('../models/bids.model');


/**
 * authenticate based on token
 */
 const isAuthenticated = (req, res, next) => {
     let token = req.get(config.get('authToken'));
     // let token = req.headers['x-authorization'];
     log.debug(`authenticating ${token}`);
     users.getIdFromToken(token, (err, user_id) => {
         if (err || user_id === null) {
             log.warn(`rejected auth attempt for token ${token}`);
             return res.sendStatus(401);
         }
         next();
     })
 };

/**
 * authorize as the owner of the user resource given in req.params.id
 */
const isUser = (req, res, next) => {
    let token = req.get(config.get('authToken'));
    users.getIdFromToken(token, (err, id) => {
        let userId = req.params.id;
        if ( !Number.isInteger(parseInt(userId)) || id !== parseInt(userId)) {
            log.warn(`rejected attempt to auth ${userId} as ${id}`);
            return res.sendStatus(403);
        }
        next()
    })
};

/**
 * authorize as the owner of the auction given in req.params.id
 */
const isAuctionOwner = (req, res, next) => {
    let token = req.get(config.get('authToken'));
    users.getIdFromToken(token, (err, id) => {
        let auctionId = req.params.id;
        if (!Number.isInteger(parseInt(auctionId))) {
            log.warn(`rejected attempt to auth ${id} as owner of non-integer ${auctionId}`);
            return res.sendStatus(403);
        }
        auctions.getCreator(parseInt(auctionId), (err, users) => {
            if (err || id !== users[0]['auction_userid']) { // err shouldn't happen - an auction without a creator (unless deleted?)
                log.warn(`rejected attempt to auth ${id} as owner of auction ${auctionId}`);
                return res.sendStatus(403);
            }
            next()
        })
    })
};

/**
 * ensure not owner of the auction given in req.params.id
 */
const isNotAuctionOwner = (req, res, next) => {
    let token = req.get(config.get('authToken'));
    users.getIdFromToken(token, (err, id) => {
        let auctionId = req.params.id;
        if (!Number.isInteger(parseInt(auctionId))) {
            log.warn(`rejected attempt to auth as non-owner of non-integer ${auctionId}`);
            return res.sendStatus(403);
        }
        auctions.getCreator(auctionId, (err, users) => {
            if (err || id === users[0]['auction_userid']) { // err shouldn't happen - an auction without a creator
                log.warn(`rejected attempt to auth as ${id} because owner of auction ${auctionId}`);
                return res.sendStatus(403);
            }
            next()
        })
    })
};

/**
 * check that an auction is `begun` (accepting bids)
 *
 * TODO: consider moving directly into auctions.controller rather than on route
 */
const isBegun = (req, res, next) => {
    let auctionId = req.params.id;
    if (!Number.isInteger(parseInt(auctionId))) {
        log.warn(`rejected attempt to auth ${id} as owner of non-integer ${auctionId}`);
        return res.sendStatus(403);
    }
    auctions.isBegun(auctionId, (err, begun) => {
        if (err) {
            log.warn(`couldn't check begun status of auction ${auctionId}: ${err}`);
            return res.sendStatus(404);
        }
        if (!begun) return res.sendStatus(403);
        next()
    })
};


const isValidAuction = (req, res, next) => {
    let auctionId = req.params.id;
    if (!Number.isInteger(parseInt(auctionId))) {
        log.warn(`rejected attempt to auth ${auctionId} as owner of non-integer ${auctionId}`);
        return res.sendStatus(403);
    }
    auctions.checkValidity(auctionId, (err, result) => {
        if (err) {
            log.warn(`couldn't check begun status of auction ${auctionId}: ${err}`);
            return res.sendStatus(403);
        }
        if (result.length === 0) {
            log.warn(`The auction of id=${auctionId} doesn't exist.`);
            return res.sendStatus(404);
        }
        next()

    })
};


module.exports = {
    isAuthenticated: isAuthenticated,
    isUser: isUser,
    isAuctionOwner: isAuctionOwner,
    isNotAuctionOwner: isNotAuctionOwner,
    isBegun: isBegun,
    isValidAuction: isValidAuction,
};
