"use strict";

/**
 * images
 *
 * by using ? placeholders in mysql module queries, all are automatically escaped against injection attacks (https://www.npmjs.com/package/mysql#preparing-queries)
 */

const
    db = require('../lib/db.js');

/**
 * return image blob for auctionId (null if the project lacks an image)
 *
 * @param auctionId
 * @param done
 */
const get = (auctionId, done) => {
    db.get().query(
        'SELECT photo_image_URI from photo WHERE photo_auctionid=?',
        auctionId,
        (err, images) => done(err, images.length>0 ? images[0] : null)
    );
};

const update = (auctionId, image, done) => {
    db.get().query(
        'INSERT INTO photo (photo_auctionid, photo_image_URI) VALUES (?, ?) ON DUPLICATE KEY UPDATE photo_image_URI=?',
        [auctionId, image.image, image.image],
        (err, results) => done(err, results)
    );
};

module.exports = {
    get: get,
    update: update
};