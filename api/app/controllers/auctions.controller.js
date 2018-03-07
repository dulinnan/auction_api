"use strict";

/**
 * controller methods for the /auctions endpoints
 */

const
    log = require('../lib/logger')(),
    schema = require('../../config/auction_api_0.0.5.json'),
    auctions = require('../models/auctions.model'),
    bids = require('../models/bids.model'),
    photos = require('../models/photos.model'),
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
                    if (!validator.isValidSchema(auctions, 'definitions.auctionsOverview')) {
                        log.warn(JSON.stringify(auctions, null, 2));
                        log.warn(validator.getLastErrors());
                        return res.sendStatus(500);
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
        if (err) {
            log.warn(err);
            return res.sendStatus(500);
        }
        if (auction === null)
            return res.sendStatus(404);
        if (!validator.isValidSchema(auction, 'definitions.auctionDetails')) {
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
    if (!validator.isValidSchema(req.body, 'definitions.auctionDetails')) {
        log.warn(`auctions.controller.create: bad auction ${JSON.stringify(req.body)}`);
        return res.sendStatus(400);
    }
    else {
        let auction = Object.assign({}, req.body); // be overly protective of req.body...
        auctions.insert(auction, (err, id) => {
            if (err)
                return res.sendStatus(500);
            return res.status(201).json({id:id});
        })
    }
};

/**
 * update infomation on a non-going auction
 */
const update = (req, res) => {
    let auctionId = parseInt(req.params.id);
    if (!validator.isValidId(auctionId)) return res.sendStatus(404);

    if (!validator.isValidSchema(req.body, 'definitions.auctionDetails')) {
        log.warn(`auctions.controller.update: bad change of auction infomation ${JSON.stringify(req.body)}`);
        return res.sendStatus(400);
    }
    else {
        auctions.isBegun(auctionId, (err, begun) => {
            if (err) return res.sendStatus(500);
            if (!begun) return res.sendStatus(403);
            auctions.update(auctionId, req.body, err => {
                if (err) return res.sendStatus(404);
                return res.sendStatus(201)
            })
        })
    }
};

/**
 * get photos uris for a single auction
 */
const getPhotoURI = (req, res) => {
    let auctionId = parseInt(req.params.id);
    if (!validator.isValidId(auctionId)) return res.sendStatus(404);

    photos.getURI(auctionId, (err, auction) => {
        if (err) {
            log.warn(err);
            return res.sendStatus(500);
        }
        if (auction === null)
            return res.sendStatus(404);
        if (!validator.isValidSchema(auction, 'components.schemas.photoUris')) {
            log.warn(JSON.stringify(auction, null, 2));
            log.warn(validator.getLastErrors());
            return res.sendStatus(500);
        }
        return res.status(200).json(auction);
    })
};

/**
 * return the photo associated with the auction
* TODO: two params
 */
const readPhoto = (req, res) => {
    let auctionId = parseInt(req.params.auctionId);
    let photoId = parseInt(req.params.photoId);
    if (!validator.isValidId(auctionId)) return res.sendStatus(404);

    photos.get(auctionId, (err, results) => {
        if (err || ! results) {
            log.warn(err, results);
            return res.sendStatus(404);
        }
        else {
            let Photo = results.Photo;
            let type = results.type;
            return res.status(200).set({'Content-Type': type, 'Content-Length': Photo.length}).send(Photo);
        }
    })
};

/**
 * add photo to an auction
 */
 const addPhoto = (req, res) => {
   let auctionId = parseInt(req.params.id);
   if (!validator.isValidId(auctionId)) return res.sendStatus(404);
   // only accept PNG and JPEG
   let contentType = req.get('Content-Type');
   if (contentType!=='image/png' && contentType !== 'image/jpeg' ) return res.sendStatus(400);

   photos.add(auctionId, {image: req.body, type: contentType}, err => {
       if (err) return res.sendStatus(404);
       return res.sendStatus(201);
   })
 };

/**
 * set the Photo associated with the auction, replacing any earlier Photo
 * (auth required)
 * TODO: two params
 */
const updatePhoto = (req, res) => {
  let auctionId = parseInt(req.params.auctionId);
  let photoId = parseInt(req.params.photoId);
    if (!validator.isValidId(auctionId)) return res.sendStatus(404);

    // only accept PNG and JPEG
    let contentType = req.get('Content-Type');
    if (contentType!=='image/png' && contentType !== 'image/jpeg' ) return res.sendStatus(400);

    photos.update(auctionId, photoId, {image: req.body, type: contentType}, err => {
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

    bids.get(auctionId, (err, Bids) => {
        if (err)
            return res.sendStatus(404);
        if (!validator.isValidSchema(Bids, 'bids'))
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

    if (!validator.isValidSchema(req.body, 'bids')) {
        log.warn(`auctions.controller.addBids: bad bids ${JSON.stringify(req.body)}`);
        log.warn(validator.getLastErrors());
        return res.sendStatus(400);
    }
    else {
        let bidsAmount = Object.assign({}, req.body);
        bids.insert(auctionId, bidsAmount, (err, id) => {
            if (err)
                return res.sendStatus(500);
            return res.status(201).json({id:id});
        })
    }
};

module.exports = {
    list: list,
    read: read,
    create: create,
    update: update,
    getPhotoURI: getPhotoURI,
    readPhoto: readPhoto,
    addPhoto: addPhoto,
    updatePhoto: updatePhoto,
    removePhoto: removePhoto,
    readBids: readBids,
    addBids: addBids
};
