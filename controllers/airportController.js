const airports = require('../data/airports');

// @desc Get all airports
// @route GET /api/airports
// @access Public
const getAirports = (req, res) => {
  res.json(airports);
};

module.exports = { getAirports };