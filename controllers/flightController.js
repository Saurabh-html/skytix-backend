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
            date
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
            date // ✅ IMPORTANT FIX
        });

        res.status(201).json(flight);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Advanced flight search
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

        // 🔥 FIXED DATE FILTER (IMPORTANT)
        if (date) {
            const start = new Date(date);
            const end = new Date(date);
            end.setDate(end.getDate() + 1);

            query.date = {
                $gte: start,
                $lt: end
            };
        }

        // Sorting
        const sortOrder = order === 'asc' ? 1 : -1;
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder;

        // Pagination
        const skip = (page - 1) * limit;

        const flights = await Flight.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Flight.countDocuments(query);

        res.json({
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            flights
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