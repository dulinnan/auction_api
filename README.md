# SENG365_auction_api

A reference implementation for the api specification in `config/auction_api_0.0.6.json`.

The code is based on the skeletons from labs 3 and 4, and so has a mix of callbacks and promises, with extensions to the lab framework mostly being promise-based.

## Version history
### Version 0.0.5, 17 March 2018
- Get all auctions API implemented.
- TODO: error handling and query validation.
- Ver_0.0.3 WIP resolved.


### Version 0.0.4, 15 March 2018
- Auction Create API implemented.
- TODO: only check schema for categoryId, not dateTime.

### Version 0.0.3, 15 March 2018
- bug fixed: now return 0 bids when an auction doesn't have a bid.
- WIP: update auction.

### Version 0.0.2, 15 March 2018
- Bids API implemented.
- Ver_0.0.1 TODO resolved.
- TODO: create auction and update auction.

### Version 0.0.1, 14 March 2018
- User API implemented.
- TODO: Using JOIN in User_model to get one auction from multiple tables.
## Usage

To start the backend service, and initialise the database, `npm start` (preferred), or `node server.js` or `docker-compose up -d`.

## Configuration

Configuration defaults are in `config/config.js`. These can be overridden in two ways (in priority order):

1. By environment variable, or command line parameter, to override any individual configuration setting. See `config/config.js` for options.
1. By values given in a javascript file in `config` named in the environment variable `NODE_ENV`, or the command line parameter `env`.
For example, if the service is started with `node server.js --env=production`, the configuration in `config/production.js` will override any default values
(but not individual values set through the environment or command line).

The default configuration assumes that a MySQL database can be found at `mysql://localhost:6033`, and that the service will run
on `http://localhost:4941/api/`.

For use with the department's `mysql2` MySQL server, create a config file in `config/production.json` based on the following
and start the service with `node server.js --env=production`:

```
{
    "db": {
        "host": "mysql3.csse.canterbury.ac.nz",
        "port": 3306,
        "user": <your UC usercode>,
        "password": <your UC student ID>,
        "database": <your UC usercode>
    }
}
```

## Sample data

Sample data can be included by setting the config variable `sampledata` to `true` (default is `false`) before starting the service. Once sample data is enabled, 
`POST /resample` will also re-add the sample data after the database is reset.
 
Projects are based on a manual scraping of selected Public Good projects from Kickstarter, edited for length.
Project images have been sourced from Wikimedia Commons, under Creative Commons. Licensing information is included for each image in the 'imagelicense' in `sample.data.js`.

## TODO: Tests

Some simple unit tests can be run through `npm test`. They assume that a database is already running on the defined config.

The full API can be tested by starting this service with `npm start` and then running the tests from the `api-test` repo.

