"use strict";

/**
 * controller methods for the root endpoints
 *
 * these endpoints are just for ease of use while testing and developing NOT for any semi-production use!
 */

const
    log = require('../lib/logger')(),
    config = require('../../config/config'),
    initData = require('../../config/sample.data.init'),
    initDb = require('../lib/db.init');

const reset = (req, res) => {
  return initDb(config.get('db', true)
      .then(() => {
      return res.sendStatus(201);
      })

  .catch(() => res.sendStatus(500)));
};

const resample = (req, res) => {
    return initDb(config.get('db'), true) // force creation of clean schema
        .then(() => {
            if (config.get('sampledata')) return initData(config.get('db'))
        })
        .then(() => res.sendStatus(201))
        .catch(() => res.sendStatus(500));
};

module.exports = {
    reset: reset,
    resample: resample
};
