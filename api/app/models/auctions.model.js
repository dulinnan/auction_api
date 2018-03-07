"use strict";

/**
 * auctions
 *
 * by using ? placeholders in mysql module queries, all are automatically escaped against injection attacks (https://www.npmjs.com/package/mysql#preparing-queries)
 */

const
    log = require('../lib/logger')({name: __filename, level: 'warn'}),
    db = require('../lib/db.js'),
    bidsModel = require('./bids.model'),
    rewardsModel = require('./rewards.model'),
    pledgesModel = require('./pledges.model'),
    usersModel = require('./users.model'),
    imagesModel = require('./images.model'),
    asTransaction = require('./transaction'),
    each = require('async-each'); // lighter-weight than the full `async` module


/**
 * return all auctions between `limit` and `limit+offset` when ordered by creation timestamp
 *
 * @param options   assume these have been validated upstream
 * @param done
 */



const getCreator = (auctionId, done) => {
    db.get().query(
        'SELECT auction_userid from auction WHERE auctionid=?',
        auctionId,
        (err, results) => done(err, results.map(result=>result.userid)) // assumes that auctions always have creators
    );
};
