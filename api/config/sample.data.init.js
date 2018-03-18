'use strict';

/**
 * create a set of sample data from auction metadata in json, and images as jpg, all found in `sampleDataDirectory`
 * auction metadata should be an array of {projectTemplate: <ProjectCreation schema>, imageFileName: <filename>}
 *
 * sample data is creating using model methods. This is one level up from direct db access (either by SQL or through
 * a db dump) and so it is db schema-independent, while it's one level down from using the API itself, which would be much
 * slower.
 */

const
    log = require('../app/lib/logger')(),
    path = require('path'),
    fs = require('fs'),
    db = require('../app/lib/db'),
    users = require('../app/models/users.model'),
    auctions = require('../app/models/auctions.model'),
    categories = require('../app/models/categories.model'),
    bids = require('../app/models/bids.model'),
    sampleData = require('./sample.data/sample.data');

const
    sampleDataDirectory = './config/sample.data';

/**
 * add a an image to a pre-existing auction
 * TODO: consolidate with methods in test directory
 *
 * @param projectId
 * @param image
 * @returns {Promise}
 */
const addImage = (projectId, image) => {
    log.info(`adding image ${image} to ${projectId}`);
    return new Promise((resolve, reject) => {
        let imageData = fs.readFileSync(path.join(sampleDataDirectory, image));
        // imageType is MIME type e.g., image/png or image/jpeg
        let fileExtension = path.extname(image).slice(1);  // remove initial '.'
        if (fileExtension==='jpg') fileExtension = 'jpeg'; // hacky munge to MIME from file extension
        images.update(projectId, {image:imageData, type:`image/${fileExtension}`}, err => {
            if (err) return reject(err);
            return resolve();
        });

    })
};

/**
 * add a user
 * TODO: consolidate with methods in test directory
 *
 * @param user
 * @returns {Promise}
 */
const createUser = user => {
    log.info(`creating user ${JSON.stringify(user)}`);
    return new Promise((resolve, reject) => {
        users.sample(user, (err, id) => {
            if (err) return reject(err);
            return resolve(id);
        })
    })
};

/**
 * add a auction, given a pre-existing user for a creator
 * TODO: consolidate with methods in test directory
 *
 * @param auction
 * @returns {Promise}
 */
const createAuction = auction => {
    log.info(`creating auction ${JSON.stringify(auction)}`);
    return new Promise((resolve, reject) => {
        auctions.sample(auction, (err, id) => {
            if (err) return reject(err);
            return resolve(id);
        })
    })
};

/**
 * add a category, given a pre-existing user for a creator
 * TODO: consolidate with methods in test directory
 *
 * @param category
 * @returns {Promise}
 */
const createCategory = category => {
    log.info(`creating category ${JSON.stringify(category)}`);
    return new Promise((resolve, reject) => {
        categories.sample(category, (err, id) => {
            if (err) return reject(err);
            return resolve(id);
        })
    })
};

/**
 * add a bid, given a pre-existing user for a creator
 * TODO: consolidate with methods in test directory
 *
 * @param bid
 * @returns {Promise}
 */
const createBid = bid => {
    log.info(`creating bid ${JSON.stringify(bid)}`);
    return new Promise((resolve, reject) => {
        bids.sample(bid, (err, id) => {
            if (err) return reject(err);
            return resolve(id);
        })
    })
};
//
// /**
//  * update the creation date for the auction. This is set automatically by the db when a auction is created,
//  * but as we don't want the sample auctions to have dates within 20 seconds of each, we override the datetime here
//  *
//  * strictly would prefer not to include SQL in this method, so this might later be moved into the model
//  *
//  * @param projectId
//  * @param datetime
//  * @returns {Promise}
//  */
// const setCreationDateTime = (projectId, datetime) => {
//     log.info(`setting datetime for ${projectId} to ${datetime}`);
//     return new Promise((resolve, reject) => {
//         db.get().query(
//             'UPDATE auctions SET ts=? WHERE id=?',
//             [datetime, projectId],
//             err => {
//                 if (err) return reject(err);
//                 resolve(projectId)
//             }
//         )
//     })
// };

/**
 * insert sample data into the db. Construct a promise chain to do the work in an ordered way (users first, then auctions and images)
 *
 * @param dbConfig   mysql database configuration object with properties for host, port, user, password and database
 * @returns {Promise}
 */
module.exports = dbConfig => {

    return new Promise((resolve, reject) => {
        db.connect(dbConfig, err => {
            if (err) return reject(err);
            let p = Promise.resolve();

            log.info('creating sample data');
            for(let user of sampleData.userData) {
                p = p.then(()=>createUser(user));
            }

            for(let category of sampleData.categoryData) {
                p = p.then(() => createCategory(category));
            }

            for(let auction of sampleData.auctionData) {
                p = p.then(() => createAuction(auction));
            }

            for(let bid of sampleData.bidData) {
                p = p.then(() => createBid(bid));
            }

            return resolve(p);
        })
    })
};