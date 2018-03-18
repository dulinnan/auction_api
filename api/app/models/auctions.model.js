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
    usersModel = require('./users.model.js'),
    categoriesModel = require('./categories.model'),
    each = require('async-each'); // lighter-weight than the full `async` module

// var detailArray = [];


/**
 * return all auctions between `limit` and `limit+offset` when ordered by creation timestamp
 *
 * @param auctionId   assume these have been validated upstream
 * @param done
 */
const getCreator = (auctionId, done) => {
    db.get().query(
        'SELECT auction_userid from auction WHERE auction_id=?',
        auctionId,
        (err, results) => done(err, results) // assumes that auctions always have creators
    );
};

const checkValidity = (auctionId, done) => {
    db.get().query(
        'SELECT auction_userid from auction WHERE auction_id=?',
        [auctionId],
        (err, results) => done(err, results)
    );
};

/**
 * sample auction data
 *
 * @param auction   assume these have been validated upstream
 * @param done
 */
const sample = (auction, done) => {
    db.get().query( // use VALUES rather than SET as project parameter includes extra fields
        'INSERT INTO auction (auction_title, auction_categoryid, auction_description, auction_reserveprice, auction_startingprice, auction_creationdate, auction_startingdate, auction_endingdate, auction_userid) VALUES (?)',
        [[auction.auction_title, auction.auction_categoryid, auction.auction_description, auction.auction_reserveprice, auction.auction_startingprice, auction.auction_creationdate, auction.auction_startingdate, auction.auction_endingdate, auction.auction_userid]],
        (err, results) => {
            if (err) return done(err);
            else
                return done(err, results.auction_id)
        }
    )
};


const getAll = (options, done) => {
    let whereConditions = [],
        joinTable1 = '',
        joinCondition1 = '',
        joinTable2= '',
        joinCondition2 = '',
        whereCondition = '',
        tableSources = {'category-id':'category', 'bidder': 'bid', 'seller': 'auction', 'q': 'auction', 'winner':'bid'};

    // set default options where defaults apply - other options are either filter-or-not
    if (!options.hasOwnProperty('count')) options.count=10000;
    if (!options.hasOwnProperty('startIndex')) options.startIndex=0;

    // construct SQL for JOINs for options for category and bid
    let parameterKeys = Object.keys(options).filter(option => Object.keys(tableSources).includes(option));
    joinTable1 = ' RIGHT JOIN auction';
    joinCondition1 = ' ON auction.auction_id=bid.bid_auctionid';
    joinTable2 = ' LEFT JOIN category';
    joinCondition2 = ' ON auction.auction_categoryid=category.category_id';
    if (parameterKeys.length > 0) {
        // let tables = parameterKeys.map(option => tableSources[option]);
        if (parameterKeys.includes('q')) {
            // 'q' ===> '%q%'
            let search = '%'+options['q']+'%';
            whereConditions = whereConditions.concat(`${tableSources['q']}.auction_title LIKE '${search}'`);
        }
        if (parameterKeys.includes('category-id')) {

            whereConditions = whereConditions.concat(`${tableSources['category-id']}.category_id=${options['category-id']}`);
        }
        if (parameterKeys.includes('seller')) {
            whereConditions = whereConditions.concat(`${tableSources['seller']}.auction_userid=${options.seller}`);
        }
        if (parameterKeys.includes('bidder') && !parameterKeys.includes('winner')) {
            whereConditions = whereConditions.concat(`${tableSources['bidder']}.bid_userid=${options.bidder}`);
        }
        if (parameterKeys.includes('winner') && !parameterKeys.includes('bidder')) {
            // TODO: bidder and winner shouldn't appear at the same time
            whereConditions = whereConditions.concat(`m.bid_amount=(SELECT MAX(bid_amount) FROM bid WHERE bid_userid=${options.winner}) AND NOW()>=auction.auction_endingdate`);
        }
    }

    // construct SQL for combined WHERE condition
    if (whereConditions.length > 0) whereCondition = ' WHERE ' + whereConditions.join(' AND ');
    console.log(whereCondition);
    let sql = `SELECT NOW(), auction.auction_id, category.category_title, auction.auction_categoryid, auction.auction_title, auction.auction_reserveprice, auction.auction_startingdate, auction.auction_endingdate, m.bid_amount FROM (SELECT bid_auctionid, bid_userid, MAX(bid_amount) as bid_amount FROM bid GROUP BY bid_auctionid, bid_userid) AS m LEFT JOIN bid ON bid.bid_auctionid = m.bid_auctionid AND bid.bid_amount = m.bid_amount${joinTable1}${joinCondition1}${joinTable2}${joinCondition2}${whereCondition} GROUP BY auction.auction_id LIMIT ? OFFSET ?`;
    log.debug(sql, [options.count, options.startIndex]);

    db.get().query(sql, [options.count, options.startIndex],
        (err, auctions) => {
        if (err) done (err);
        if (!auctions) return done(err, null);
        each(auctions,
            (auction, callback) => {
            let id = auction.auction_id;
                callback(err, {id: id, categoryTitle: auction.category_title, categoryId: auction.auction_categoryid, title: auction.auction_title, reservePrice: auction.auction_reserveprice, startDateTime: auction.auction_startingdate, endDateTime: auction.auction_endingdate, currentBid: auction.bid_amount})
            },
            (err, auctions) => {
                if (err) return done(err);
                return done(null, auctions);
            }
        )
        })
};

/**
 *
 * @param auctionId
 * @param done
 */
const getOne = (auctionId, done) => {
    let _getCategory = auctionId => {
        return new Promise((resolve, reject) => {
            categoriesModel.get(auctionId, (err, categories) => {
                if (err) return reject(err);
                if (categories.length === 0) return resolve(null);
                resolve({categoryId: categories[0]['category_id'], categoryTitle: categories[0]['category_title']});
            })
        })
    };
    let _getAuction = auctionId => {
        return new Promise((resolve, reject) => {
            let query = 'SELECT auction_title, auction_reserveprice, auction_startingdate, ' +
                'auction_endingdate, auction_description, auction_creationdate ' +
                'FROM auction WHERE auction_id=?';
            db.get().query(query, [auctionId],
                (err, auctions) => {
                if (err) return reject(err);
                if (auctions.length === 0) return resolve(null);
                resolve({title: auctions[0]['auction_title'], reservePrice: auctions[0]['auction_reserveprice'],
                    startDateTime: auctions[0]['auction_startingdate'], endDateTime: auctions[0]['auction_endingdate'],
                    description: auctions[0]['auction_description'], creationDateTime: auctions[0]['auction_creationdate']});
            })

        });
    };

    let _getSeller = auctionId => {
        return new Promise((resolve, reject) => {
            usersModel.getSeller(auctionId,
                (err, seller) => {
                if (err) return reject(err);
                if (seller.length === 0) return resolve(null);
                resolve(seller.map(seller => {return {id: seller['user_id'], username: seller['user_username']}}));
                })
        })
    };

    let _getCurrentBid = auctionId => {
        return new Promise((resolve, reject) => {
            bidsModel.get(auctionId,
                (err, currentBid) => {
                    if (err) return reject (err);
                    if (currentBid.length === 0) return resolve({startingBid: 0, currentBid: 0});
                    resolve({startingBid: currentBid[0]['bid_amount'], currentBid: currentBid[currentBid.length-1]['bid_amount']});
                    })
        })
    };

    let _getBidHistory = auctionId => {
      return new Promise((resolve, reject) => {
          bidsModel.getHistory(auctionId, (err, bids) => {
              if (err) return reject(err);
              resolve(bids);
          })
      })
    };

    Promise.all([_getCategory(auctionId), _getAuction
    (auctionId), _getSeller(auctionId), _getCurrentBid
    (auctionId), _getBidHistory(auctionId)])
        .then(results => {
            if (results[0] === null) return done(null, null);
            Object.assign(results[0], results[1]);
            let auctionDetails = results[0];
            auctionDetails.seller = results[2][0];
            Object.assign(auctionDetails, results[3]);
            auctionDetails.bids = results[4];
            return done(null, auctionDetails);
        })
        .catch(err => {
            log.fatal(`could not get auction ${auctionId}`);
            return done(err, null);
        })
};

/**
 *
 * @param userId
 * @param auction
 * @param done
 */
const insert = (userId, auction, done) => {
    let now = new Date().toISOString();
    let query = 'INSERT INTO auction (auction_userid, auction_categoryid, auction_title, ' +
        'auction_description, auction_creationdate, auction_startingdate,' +
        ' auction_endingdate, auction_reserveprice, auction_startingprice) VALUES (?);';
    let params = [userId, auction['categoryId'], auction['title'], auction['description'], now,
        auction['startDateTime'], auction['endDateTime'], auction['reservePrice'], auction['startingBid']];
    db.get().query(query, [params],
        (err, results) => {
            if (err) return done(err);
            return done(err, results['insertId'])
        });
};


/**
 *
 * @param auctionId
 * @param auction
 * @param done
 */
const alter = (auctionId, auction, done) => {
  let query = 'UPDATE auction SET auction_categoryid=?, auction_title=?, auction_description=?, ' +
      'auction_startingdate=?, auction_endingdate=?, auction_reserveprice=?, auction_startingprice=? ' +
      'WHERE auction_id=?';
  db.get().query(query, [auction.categoryId, auction.title, auction.description,
      auction.startDateTime, auction.endDateTime, auction.reservePrice, auction.startingBid, auctionId],
      (err, results) => {
      if (err) return done(err);
      return done(err, results.auction_id)
      })

};


module.exports = {
    getCreator: getCreator,
    checkValidity: checkValidity,
    sample: sample,
    getAll: getAll,
    getOne: getOne,
    insert: insert,
    alter: alter
};