"use strict";

/**
 * users
 *
 * by using ? placeholders in mysql module queries, all are automatically escaped against injection attacks (https://www.npmjs.com/package/mysql#preparing-queries)
 */

const
    crypto = require('crypto'),
    db = require('../lib/db.js');


/**
 * hash password
 *
 * @param password
 * @param salt
 *
 * TODO: change the length to 256 when submitting to server AND change the salt length from 16 to 64.
 */
const getHash = (password, salt) => {
    return crypto.pbkdf2Sync(password, salt, 4000, 32, 'SHA256').toString('hex');
};

/**
 * return user details, or null if user not found
 *
 * @param id
 * @param done
 */
const getOne = (id, done) => {
    let query = 'SELECT user_username, user_givenname, user_familyname, user_email, user_accountbalance FROM auction_user WHERE user_id=?';
    db.get().query(
        query,
        [id],
        (err, users) => {
            if (err)
                return done(err);
            return done(err, users.length>0 ? users[0] : null);
        }
    )
};

/**
 *
 * @param auctionId
 * @param done
 */
const get = (auctionId, done) => {
    let query = 'SELECT auction_user.user_id, auction_user.user_username FROM auction_user ' +
        'JOIN auction ON auction_user.user_id = auction.auction_userid ' +
        'WHERE auction.auction_id=?';
    db.get().query(query, [auctionId],
        (err, result) => {
            if (err) return done(err);
            else
                return done(err, result);
        }
    )
};

/**
 * insert user
 *
 * @param user
 * @param done
 * TODO: HASH & SALT
 */
const sample = (user, done) => {
    const salt = crypto.randomBytes(16);
    const hash = getHash(user.user_password, salt);

    db.get().query(
        'INSERT INTO auction_user (user_username, user_givenname, user_familyname, user_email, user_password, user_salt, user_accountbalance, user_reputation) VALUES (?)',
        [[user.user_username, user.user_givenname, user.user_familyname, user.user_email, hash, salt.toString('hex'), user.user_accountbalance, user.user_reputation]],
        (err, results) => {
            if (err)
                return done(err);
            return done(err, results.id)
        }
    );
};

/**
 * insert user
 *
 * @param user
 * @param done
 * TODO: HASH & SALT
 */
const insert = (user, done) => {

    const salt = crypto.randomBytes(16);
    const hash = getHash(user.password, salt);

    db.get().query(
        'INSERT INTO auction_user (user_username, user_givenname, user_familyname, user_email, user_password, user_salt) VALUES (?,?,?,?,?,?)',
        [user.username, user.givenName, user.familyName, user.email, user.password, hash],
        (err, results) => {
            if (err)
                return done(err);
            return done(err, results.id)
        }
    );
};

/**
 * update user
 *
 * @param id
 * @param user
 * @param done
 */
const alter = (id, user, done) => {

    const salt = crypto.randomBytes(16);
    const hash = getHash(user.password, salt);

    db.get().query(
        'UPDATE auction_user SET user_username=?, user_givenname=?, user_familyname=?, user_email=?, user_password=?, user_salt=? WHERE user_id=?',
        [user.username, user.givenName, user.familyName, user.email, hash, salt.toString('hex'), id],
        (err, results) => done(err)
    )
};


/**
 * check password is correct for user
 * @param username    either username or email
 * @param email
 * @param password
 * @param done  true if password is correct
 */
const authenticate = (username, email, password, done) => {
    let query = 'SELECT user_id, user_password, user_salt FROM auction_user WHERE (user_username=? OR user_email=?)';
    db.get().query(query,
        [username, email],
        (err, results) => {
            if (err || results.length !== 1)
                return done(true); // return error = true (failed auth)
            else {
                let salt = Buffer.from(results[0].user_salt, 'hex');
                let re_hash = getHash(password, salt);
                if (results[0].user_password === re_hash) return done(false, results[0].user_id);
                return done(true); // failed password check
            }
        }
    )
};


/**
 * get existing token
 *
 * @param id
 * @param done
 */
const getToken = (id, done) => {
    db.get().query(
        'SELECT user_token FROM auction_user WHERE user_id=?',
        [id],
        (err, results) => {
            if (results.length === 1 && results[0].token)
                return done(null, results[0].token);
            return done(null, null);
        }
    )
};

/**
 * create and store a new token for a user
 *
 * @param id
 * @param done
 */
const setToken = (id, done) => {
    let token = crypto.randomBytes(16).toString('hex');
    db.get().query(
        'UPDATE auction_user SET user_token=? WHERE user_id=?',
        [token, id],
        err => {return done(err, token)}
    )
};

/**
 * remove the token for a user
 *
 * @param token
 * @param done
 */
const removeToken = (token, done) => {
    db.get().query(
        'UPDATE auction_user SET user_token=null WHERE user_token=?',
        [token],
        err => {return done(err)}
    )
};

/**
 * get the user id associated with a given token, return null if not found
 *
 * @param token
 * @param done
 * @returns {*}
 */
const getIdFromToken = (token, done) => {
    if (token === undefined || token === null)
        return done(true, null);
    else {
        db.get().query(
            'SELECT user_id FROM auction_user WHERE user_token=?',
            [token],
            (err, result) => {
                if (result.length === 1)
                    return done(null, result[0].user_id);
                // return done(err, null);
            }
        )
    }
};

module.exports = {
    getOne: getOne,
    getSeller: get,
    sample: sample,
    insert: insert,
    alter: alter,
    authenticate: authenticate,
    getToken: getToken,
    setToken: setToken,
    removeToken: removeToken,
    getIdFromToken: getIdFromToken
};
