"use strict";

/**
 * controller methods for the /auctions endpoints
 */

const
    log = require('../lib/logger')(),
    schema = require('../../config/auction_api_0.0.7.json'),
    auctions = require('../models/auctions.model'),
    bids = require('../models/bids.model'),
    users = require('../models/users.model'),
    photos = require('../models/photos.model'),
    config = require('../../config/config'),
    validator = require('../lib/validator');


/**
 * list all auctions, filtering by req.query parameters
 */
const list = (req, res) => {
    validator.areValidParameters(req.query, schema.paths['/auctions'].get.parameters)
        .then(query => {
            auctions.getAll(query, (err, auctions) => {
                // validate response
                if (auctions.length > 0) {
                    for (let auction of auctions) {
                        if (!validator.isValidSchema(auction, 'components.schemas.auctionsOverview.items.allOf[0]')) {
                            log.warn(JSON.stringify(auction, null, 2));
                            log.warn(validator.getLastErrors());
                            return res.sendStatus(500);
                        }
                    }
                }
                return res.status(200).json(auctions);
            })
        })
        .catch(() => res.sendStatus(400))
};

/**
 * get details for a single auction
 */
const read = (req, res) => {
    let auctionId = parseInt(req.params.id);
    if (!validator.isValidId(auctionId)) return res.sendStatus(404);

    auctions.getOne(auctionId, (err, auction) => {
        if (!validator.isValidSchema(auction, 'components.schemas.auctionDetails.allOf[0]')) {
            log.warn(JSON.stringify(auction, null, 2));
            log.warn(validator.getLastErrors());
            return res.sendStatus(500);
        }
        return res.status(200).json(auction);
    })
};

/**
 * create auction
 */
const create = (req, res) => {
    if (!validator.isValidSchema(req.body, 'components.schemas.auctionDetails.allOf[0]')) {
        log.warn(`auctions.controller.create: bad auction ${JSON.stringify(req.body)}`);
        return res.sendStatus(400);
    }
    else if (!validator.isValidSchema(req.body['startingBid'], 'components.schemas.startingBid.properties')) {
        log.warn(`auctions.controller.update: bad change of auction information ${JSON.stringify(req.body['startingBid'])}`);
        return res.sendStatus(400);
    }
    else {
        let token = req.get(config.get('authToken'));
        users.getIdFromToken(token, (err, _id) => {
            if (err) return res.sendStatus(500);
            let auction = Object.assign({}, req.body); // be overly protective of req.body...
            auctions.insert(_id, auction, (err, id) => {
                if (err)
                    return res.sendStatus(500);
                return res.status(201).json({id:id});
            })
        })
    }
};

/**
 * update infomation on a still-going auction
 */
const update = (req, res) => {
    let auctionId = parseInt(req.params.id);
    console.log(JSON.stringify(req.body));
    if (!validator.isValidId(auctionId)) return res.sendStatus(404);

    if (!validator.isValidSchema(req.body, 'components.schemas.auctionsOverview.items.allOf[0]')) {
        log.warn(`auctions.controller.update: bad change of auction information ${JSON.stringify(req.body)}`);
        return res.sendStatus(400);
    }
    else if (!validator.isValidSchema(req.body['startingBid'], 'components.schemas.startingBid.properties')) {
        log.warn(`auctions.controller.update: bad change of auction information ${JSON.stringify(req.body['startingBid'])}`);
        return res.sendStatus(400);
    }
    else {
        // auctions.isBegun(auctionId, (err, begun) => {
        //     if (err) return res.sendStatus(500);
        //     if (!begun) return res.sendStatus(403);
        //     auctions.alter(auctionId, req.body, err => {
        //         if (err) return res.sendStatus(404);
        //         return res.sendStatus(201)
        //     })
        // })
            auctions.alter(auctionId, req.body, err => {
                if (err) return res.sendStatus(404);
                return res.sendStatus(201)
            })
    }
};

// /**
//  * get photos uris for a single auction
//  */
// const getPhotoURI = (req, res) => {
//     let auctionId = parseInt(req.params.id);
//     if (!validator.isValidId(auctionId)) return res.sendStatus(404);
//
//     photos.getURI(auctionId, (err, auction) => {
//         if (err) {
//             log.warn(err);
//             return res.sendStatus(500);
//         }
//         if (auction === null)
//             return res.sendStatus(404);
//         if (!validator.isValidSchema(auction, 'components.schemas.photoUris')) {
//             log.warn(JSON.stringify(auction, null, 2));
//             log.warn(validator.getLastErrors());
//             return res.sendStatus(500);
//         }
//         return res.status(200).json(auction);
//     })
// };

/**
 * return the photo associated with the auction
* TODO: two param* TODO: two paramss
 */
const readPhoto = (req, res) => {
    let auctionId = parseInt(req.params.id);
    if (!validator.isValidId(auctionId)) return res.sendStatus(404);

    photos.get(auctionId, (err, results) => {
        if (err || ! results) {
            log.warn(err, results);
            return res.sendStatus(404);
        }
        else {
            let image = results.image;
            let type = results.type;
            return res.status(200).set({'Content-Type': type, 'Content-Length': image.length}).send(image);
        }
    })


};

// /**
//  * add photo to an auction
//  */
//  const addPhoto = (req, res) => {
//    let auctionId = parseInt(req.params.id);
//    if (!validator.isValidId(auctionId)) return res.sendStatus(404);
//    // only accept PNG and JPEG
//    let contentType = req.get('Content-Type');
//    if (contentType!=='image/png' && contentType !== 'image/jpeg' ) return res.sendStatus(400);
//
//    photos.add(auctionId, {image: req.body, type: contentType}, err => {
//        if (err) return res.sendStatus(404);
//        return res.sendStatus(201);
//    })
//  };

/**
 * set the Photo associated with the auction, replacing any earlier Photo
 * (auth required)
 * TODO: two params
 */
const updatePhoto = (req, res) => {
  let auctionId = parseInt(req.params.id);
  // let photoId = parseInt(req.params.photoId);
    if (!validator.isValidId(auctionId)) return res.sendStatus(404);

    // only accept PNG and JPEG
    let contentType = req.get('Content-Type');
    if (contentType!=='image/png' && contentType !== 'image/jpeg' ) return res.sendStatus(400);

    photos.update(auctionId, {image: req.body, type: contentType}, err => {
        if (err) return res.sendStatus(404);
        return res.sendStatus(201);
    })
};

/**
 * delete the photo given by request param :id
 * (auth required)
* TODO: two params
 */
const removePhoto = (req, res) => {
  let auctionId = parseInt(req.params.auctionId);
  let photoId = parseInt(req.params.photoId);
    if (!validator.isValidId(auctionId)) return res.sendStatus(404);

    let token = req.get(config.get('authToken'));
    photos.getIdFromToken(token, (err, _id) => {
        if (_id !== id)
            return res.sendStatus(403);
        else
            photos.removePhoto(_id, err => {
                if (err)
                    return res.sendStatus(500);
                return res.sendStatus(200)
            })
    })
};

/**
 * return all bids for the auction
 */
const readBids = (req, res) => {
    let auctionId = parseInt(req.params.id);
    if (!validator.isValidId(auctionId)) return res.sendStatus(404);
    bids.getHistory(auctionId, (err, Bids) => {
        if (err)
            return res.sendStatus(404);
        if (!validator.isValidSchema(Bids, 'components.schemas.bidHistory.items.properties'))
            return res.sendStatus(500);
        return res.status(200).json(Bids)
    })
};

/**
 * receive bid to the auction
 * assumes that auction is open to bids (enforced in route)
 *
 * TODO: post-condition to check that the bid amount is reflected in the auction totals
 */
const addBids = (req, res) => {
    let auctionId = parseInt(req.params.id);
    if (!validator.isValidId(auctionId)) return res.sendStatus(404);
    if (!validator.isValidSchema(req.query, 'components.schemas.bidHistory.items.properties')) {
        log.warn(`auctions.controller.addBids: bad bids ${JSON.stringify(req.query)}`);
        log.warn(validator.getLastErrors());
        return res.sendStatus(400);
    }
    else {
        let token = req.get(config.get('authToken'));
        users.getIdFromToken(token, (err, _id) => {
            if (err) return res.sendStatus(500);
            let bidsAmount = req.query.amount;
            bids.insert(_id, auctionId, bidsAmount, (err, id) => {
                if (err)
                    return res.sendStatus(500);
                return res.status(201).json({id:id});
            })
        });
    }
};

module.exports = {
    list: list,
    read: read,
    create: create,
    update: update,
    // getPhotoURI: getPhotoURI,
    readPhoto: readPhoto,
    // addPhoto: addPhoto,
    updatePhoto: updatePhoto,
    removePhoto: removePhoto,
    readBids: readBids,
    addBids: addBids
};
