const Booking = require('../models/bookingModel');
const Flight = require('../models/flightModel');

// @desc Create booking
const createBooking = async (req, res) => {
  try {
    const { flightId, passengers, date } = req.body;

    const flight = await Flight.findById(flightId);

    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    const seatsRequested = passengers.length;

    const dateKey = new Date(date).toISOString().split('T')[0];

    //  GET DATE-WISE SEATS
    const availableSeats =
      flight.seatsByDate.get(dateKey) ?? flight.seatsAvailable;

    if (availableSeats < seatsRequested) {
      return res.status(400).json({
        message: 'Not enough seats available for selected date'
      });
    }

    const totalPrice = flight.price * seatsRequested;

    const booking = await Booking.create({
      user: req.user._id,
      flight: flightId,
      date,
      passengers,
      totalPrice
    });

    //  UPDATE DATE-WISE SEATS
    flight.seatsByDate.set(
      dateKey,
      availableSeats - seatsRequested
    );

    await flight.save();

    res.status(201).json(booking);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc Get bookings
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user._id,
      date: { $gte: new Date() }
    })
      .populate('flight')
      .populate('user', 'name email');

    res.json(bookings);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc Cancel selected passengers
const cancelBooking = async (req, res) => {
  try {
    const { passengerIndexes } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const flight = await Flight.findById(booking.flight);

    const dateKey = new Date(booking.date).toISOString().split('T')[0];

    const remainingPassengers = booking.passengers.filter(
      (_, index) => !passengerIndexes.includes(index)
    );

    const cancelledCount =
      booking.passengers.length - remainingPassengers.length;

    const existingSeats =
      flight.seatsByDate.get(dateKey) ?? flight.seatsAvailable;

    //  RETURN SEATS TO SAME DATE
    flight.seatsByDate.set(
      dateKey,
      existingSeats + cancelledCount
    );

    if (remainingPassengers.length === 0) {
      await booking.deleteOne();
    } else {
      booking.passengers = remainingPassengers;
      booking.totalPrice =
        remainingPassengers.length * flight.price;
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