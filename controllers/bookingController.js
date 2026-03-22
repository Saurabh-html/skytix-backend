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
        const bookings = await Booking.find({ user: req.user._id, date: { $gte: new Date() } })
            .populate('flight')   // brings flight details
            .populate('user', 'name email'); // optional

        res.json(bookings);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Cancel selected passengers
// @route DELETE /api/bookings/:id
// @access Private

const cancelBooking = async (req, res) => {
  try {
    const { passengerIndexes } = req.body; // array of indexes

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const flight = await Flight.findById(booking.flight);

    // Remove selected passengers
    const remainingPassengers = booking.passengers.filter(
      (_, index) => !passengerIndexes.includes(index)
    );

    const cancelledCount = booking.passengers.length - remainingPassengers.length;

    // Update booking
    booking.passengers = remainingPassengers;
    booking.seatsBooked = remainingPassengers.length;
    booking.totalPrice = booking.seatsBooked * flight.price;

    // Return seats back to flight
    flight.seatsAvailable += cancelledCount;

    // If no passengers left → delete booking
    if (booking.passengers.length === 0) {
      await booking.deleteOne();
    } else {
      await booking.save();
    }

    await flight.save();

    res.json({
      message: 'Selected tickets cancelled successfully'
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createBooking, getMyBookings, cancelBooking };