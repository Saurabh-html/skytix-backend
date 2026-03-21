const express = require('express');
const router = express.Router();
const { createFlight, getFlights, cancelFlight } = require('../controllers/flightController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public route (anyone can search flights)
router.get('/', getFlights);

// Only admin can create flights
router.post('/', protect, admin, createFlight);

//Cancel Flight (Admin)
router.put('/:id/cancel', protect, admin, cancelFlight);

module.exports = router;