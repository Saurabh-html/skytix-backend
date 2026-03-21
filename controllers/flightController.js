const Flight = require('../models/flightModel');

// @desc    Create flight
// @route   POST /api/flights
// @access  Private/Admin
const createFlight = async (req, res) => {
    try {
        const {
            flightNumber,
            airline,
            from,
            to,
            departureTime,
            arrivalTime,
            price,
            seatsAvailable,
            scheduleType,
            daysOfWeek
        } = req.body;

        const flight = await Flight.create({
            flightNumber,
            airline,
            from,
            to,
            departureTime,
            arrivalTime,
            price,
            seatsAvailable,
            scheduleType,
            daysOfWeek
        });

        res.status(201).json(flight);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Get flights with schedule logic
// @route   GET /api/flights
// @access  Public
const getFlights = async (req, res) => {
    try {
        const {
            from,
            to,
            date,
            sortBy = 'price',
            order = 'asc',
            page = 1,
            limit = 5
        } = req.query;

        let query = {};

        // 🔍 From filter
        if (from) {
            query.from = { $regex: from, $options: 'i' };
        }

        // 🔍 To filter
        if (to) {
            query.to = { $regex: to, $options: 'i' };
        }

        let flights = await Flight.find(query);

        // 🔥 APPLY SCHEDULE LOGIC
        if (date) {
            const selectedDay = new Date(date).getDay();

            flights = flights.filter(flight => {
                // Daily flights → always available
                if (flight.scheduleType === 'daily') return true;

                // Weekly flights → match day
                if (flight.scheduleType === 'weekly') {
                    return flight.daysOfWeek.includes(selectedDay);
                }

                return false;
            });
        }

        // 🔽 SORTING
        const sortOrder = order === 'asc' ? 1 : -1;

        flights.sort((a, b) => {
            if (sortBy === 'price') {
                return sortOrder * (a.price - b.price);
            }
            return 0;
        });

        // 🔽 PAGINATION
        const startIndex = (page - 1) * limit;
        const paginatedFlights = flights.slice(startIndex, startIndex + parseInt(limit));

        res.json({
            total: flights.length,
            page: Number(page),
            pages: Math.ceil(flights.length / limit),
            flights: paginatedFlights
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Cancel flight (Admin)
const cancelFlight = async (req, res) => {
    try {
        const flight = await Flight.findById(req.params.id);

        if (!flight) {
            return res.status(404).json({ message: 'Flight not found' });
        }

        flight.status = 'cancelled';
        await flight.save();

        res.json({
            message: 'Flight cancelled successfully',
            flight
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createFlight, getFlights, cancelFlight };