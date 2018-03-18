"use strict";

/**
 * auctions
 *
 * by using ? placeholders in mysql module queries, all are automatically escaped against injection attacks (https://www.npmjs.com/package/mysql#preparing-queries)
 */

const
    log = require('../lib/logger')({name: __filename, level: 'warn'}),
    db = require('../lib/db.js'),
    // bidsModel = require('./bids.model'),
    usersModel = require('./users.model'),
    each = require('async-each'); // lighter-weight than the full `async` module

const sample = (category, done) => {
    db.get().query( // use VALUES rather than SET as project parameter includes extra fields
        'INSERT INTO category (category_title, category_description) VALUES (?)',
        [[category.category_title, category.category_description]],
        (err, results) => {
            if (err) return done(err);
            else
                return done(err, results.category_id)
        }
    )
};

const get = (auctionId, done) => {
    let query = 'SELECT category.category_id, category.category_title ' +
        'FROM category JOIN auction ' +
        'ON category.category_id = auction.auction_categoryid ' +
        'WHERE auction.auction_id=?';
    db.get().query(query, [auctionId],
        (err, result) => {
            if (err) return done(err);
            else
                return done(err, result);
        }
    )
};



module.exports = {
    sample: sample,
    get: get
};