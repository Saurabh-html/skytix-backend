const Booking = require('../models/bookingModel');
const Flight = require('../models/flightModel');

const getDateKey = (date) => {
  return new Date(date).toLocaleDateString('en-CA');
};

// CREATE BOOKING
const createBooking = async (req, res) => {
  try {
    const { flightId, passengers, date } = req.body;

    // ✅ basic validation
    if (!flightId || !date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({ message: 'Passengers required' });
    }

    for (let p of passengers) {
      if (!p.name || !p.age || !p.gender) {
        return res.status(400).json({
          message: 'Invalid passenger details'
        });
      }
    }

    const selectedDate = new Date(date);
    const today = new Date();

    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 2);

    if (selectedDate < today) {
      return res.status(400).json({ message: 'Cannot book past flights' });
    }

    if (selectedDate > maxDate) {
      return res.status(400).json({ message: 'Booking allowed within 2 months' });
    }

    const flight = await Flight.findById(flightId);

    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    const booking = await Booking.create({
      user: req.user._id,
      flight: flightId,
      date,
      passengers
    });

    res.status(201).json({
      success: true,
      booking
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong'
    });
  }
};

// GET MY BOOKINGS
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user._id,
      date: { $gte: new Date() }
    }).populate('flight');

    res.json({ success: true, bookings });

  } catch {
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.'
    });
  }
};

// CANCEL BOOKING
const cancelBooking = async (req, res) => {
  try {
    const { passengerIndexes } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const flight = await Flight.findById(booking.flight);

    const dateKey = getDateKey(booking.date);

    let seatsForDate =
      flight.seatsByDate.get(dateKey) || { ...flight.seatConfig };

    const remainingPassengers = booking.passengers.filter(
      (_, i) => !passengerIndexes.includes(i)
    );

    const cancelledCount =
      booking.passengers.length - remainingPassengers.length;

    seatsForDate[booking.seatClass] += cancelledCount;

    flight.seatsByDate.set(dateKey, seatsForDate);

    if (remainingPassengers.length === 0) {
      await booking.deleteOne();
    } else {
      booking.passengers = remainingPassengers;
      booking.totalPrice =
        remainingPassengers.length *
        flight.priceConfig[booking.seatClass];

      await booking.save();
    }

    await flight.save();

    res.json({ success: true, message: 'Tickets cancelled' });

  } catch {
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.'
    });
  }
};

// ADMIN: GET ALL BOOKINGS
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('flight')
      .populate('user', 'name email');

    res.json({ success: true, bookings });

  } catch {
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.'
    });
  }
};

// ADMIN: STATS
const getBookingStats = async (req, res) => {
  try {
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: "$totalPrice" },
          totalPassengers: { $sum: { $size: "$passengers" } }
        }
      }
    ]);

    const daily = await Booking.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          bookings: { $sum: 1 },
          revenue: { $sum: "$totalPrice" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalBookings: 0,
        totalRevenue: 0,
        totalPassengers: 0
      },
      daily
    });

  } catch {
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.'
    });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  cancelBooking,
  getAllBookings,
  getBookingStats
};