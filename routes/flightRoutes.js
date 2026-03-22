const express = require('express');
const router = express.Router();

const {
  createFlight,
  getFlights,
  cancelFlight,
  bulkCreateFlights,
  cancelFlightByDate,
  deleteFlight
} = require('../controllers/flightController');

const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', getFlights);

router.post('/', protect, admin, createFlight);

router.post('/bulk', protect, admin, bulkCreateFlights);

router.put('/:id/cancel-date', protect, admin, cancelFlightByDate);

router.put('/:id/cancel', protect, admin, cancelFlight);

router.delete('/:id', protect, admin, deleteFlight);

module.exports = router;