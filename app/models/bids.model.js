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
    usersModel = require('./users.model'),
    each = require('async-each'); // lighter-weight than the full `async` module

/**
 *
 * @param bid
 * @param done
 */
const sample = (bid, done) => {
    db.get().query( // use VALUES rather than SET as project parameter includes extra fields
        'INSERT INTO bid (bid_userid, bid_auctionid, bid_amount, bid_datetime) VALUES (?)',
        [[bid.bid_userid, bid.bid_auctionid, bid.bid_amount, bid.bid_datetime]],
        (err, results) => {
            if (err) return done(err);
            else
                return done(err)
        }
    )
};

/**
 *
 * @param auctionId
 * @param done
 */
const getBid = (auctionId, done) => {
    let query = 'SELECT bid_amount FROM bid WHERE bid_auctionid=? ORDER BY bid_datetime ASC';
    db.get().query(query, [auctionId],
        (err, result) => {
            if (err) return done(err);
            else
                return done(err, result);
        }
    )
};

/**
 *
 * @param auctionId
 * @param done
 */
const getHistory = (auctionId, done) => {
    let query = 'SELECT bid.bid_amount, bid.bid_datetime, auction_user.user_id, auction_user.user_username ' +
        'FROM bid JOIN auction_user ON bid.bid_userid=auction_user.user_id ' +
        'WHERE bid.bid_auctionid=?;';
    db.get().query(query, [auctionId],
        (err, bids) => {
        if (err) return done(err);
        each(bids,
            (bid, callback) => {
                let username = bid.user_username;
                callback(err, {amount: bid.bid_amount, datetime: bid.bid_datetime, buyerId: bid.user_id, buyerUsername: username})
            },
            (err, bids) => {
                if (err) return done(err);
                return done(null, bids);

            }
        )
    })
};

const insert = (userId, auctionId, amount, done) => {
    let now = new Date().toISOString();
    db.get().query( // use VALUES rather than SET as project parameter includes extra fields
        'INSERT INTO bid (bid_userid, bid_auctionid, bid_amount, bid_datetime) VALUES (?)',
        [[userId, auctionId, amount, now]],
        (err, results) => {
            if (err) return done(err);
            else
                return done(null, results['bid_id']);
        }
    )
};

module.exports = {
    sample: sample,
    get: getBid,
    getHistory: getHistory,
    insert: insert
};
