const Flight = require('../models/flightModel');

// @desc    Create flight
// @route   POST /api/flights
// @access  Private/Admin
const createFlight = async (req, res) => {
    try {
        const flight = await Flight.create(req.body);
        res.status(201).json(flight);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all flights (with optional filters)
// @route   GET /api/flights
// @access  Public
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

        // Case-insensitive search
        if (from) {
            query.from = { $regex: from, $options: 'i' };
        }

        if (to) {
            query.to = { $regex: to, $options: 'i' };
        }

        // Date filtering
        if (date) {
            const start = new Date(date);
            const end = new Date(date);
            end.setDate(end.getDate() + 1);

            query.departureTime = {
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
// @route   PUT /api/flights/:id/cancel
// @access  Private/Admin
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