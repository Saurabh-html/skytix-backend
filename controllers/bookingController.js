const Booking = require('../models/bookingModel');
const Flight = require('../models/flightModel');

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
    try {
        const { flightId, passengers, date } = req.body;

        // 1. Find flight
        const flight = await Flight.findById(flightId);

        if (!flight) {
            return res.status(404).json({ message: 'Flight not found' });
        }

        // 🔥 NEW: seats = number of passengers
        const seatsRequested = passengers.length;

        // 2. Check seat availability
        if (flight.seatsAvailable < seatsRequested) {
            return res.status(400).json({ message: 'Not enough seats available' });
        }

        // 3. Calculate total price
        const totalPrice = flight.price * seatsRequested;

        // 4. Create booking (UPDATED STRUCTURE)
        const booking = await Booking.create({
            user: req.user._id,
            flight: flightId,
            date,
            passengers,
            totalPrice
        });

        // 5. Reduce seats
        flight.seatsAvailable -= seatsRequested;
        await flight.save();

        res.status(201).json(booking);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged-in user's bookings
// @route   GET /api/bookings/my
// @access  Private
const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate('flight')   // brings flight details
            .populate('user', 'name email'); // optional

        res.json(bookings);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel booking (partial or full)
// @route   DELETE /api/bookings/:id
// @access  Private
const cancelBooking = async (req, res) => {
    try {
        const { seats } = req.body; // seats to cancel

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Ownership check
        if (booking.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Validate seats
        if (seats > booking.seatsBooked) {
            return res.status(400).json({ message: 'Cannot cancel more seats than booked' });
        }

        // Restore seats in flight
        const flight = await Flight.findById(booking.flight);
        if (flight) {
            flight.seatsAvailable += seats;
            await flight.save();
        }

        // Case 1: Partial cancellation
        if (seats < booking.seatsBooked) {
            booking.seatsBooked -= seats;
            booking.totalPrice = booking.seatsBooked * flight.price;
            await booking.save();

            return res.json({
                message: 'Partial cancellation successful',
                booking
            });
        }

        // Case 2: Full cancellation
        await booking.deleteOne();

        res.json({ message: 'Booking fully cancelled' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createBooking, getMyBookings, cancelBooking };