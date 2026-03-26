const Booking = require('../models/bookingModel');
const Flight = require('../models/flightModel');

const getDateKey = (date) => {
  return new Date(date).toLocaleDateString('en-CA');
};

// CREATE BOOKING
const createBooking = async (req, res) => {
  try {
    const { flightId, passengers, date, seatClass } = req.body;

    if (!flightId || !date || !seatClass) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const validClasses = ['economy', 'business', 'first'];
    if (!validClasses.includes(seatClass)) {
      return res.status(400).json({ message: 'Invalid seat class' });
    }

    if (!Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({ message: 'Passengers required' });
    }

    for (let p of passengers) {
      if (!p.name || !p.age || !p.gender || !p.seat) {
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

    const dateKey = getDateKey(date);
    const selectedDay = selectedDate.getDay();

    if (
      flight.scheduleType === 'weekly' &&
      !flight.daysOfWeek.includes(selectedDay)
    ) {
      return res.status(400).json({ message: 'Flight not available on this day' });
    }

    if (flight.cancelledDates.includes(dateKey)) {
      return res.status(400).json({ message: 'Flight cancelled for this date' });
    }

    const seatsRequested = passengers.length;

    //  SAFE seatConfig fallback
    const baseSeats = flight.seatConfig || {
      economy: 0,
      business: 0,
      first: 0
    };

    let seatsForDate =
      flight.seatsByDate.get(dateKey) || { ...baseSeats };

    const availableSeats = seatsForDate[seatClass] || 0;

    if (availableSeats < seatsRequested) {
      return res.status(400).json({
        message: `Only ${availableSeats} ${seatClass} seats left`
      });
    }

    // SAFE priceConfig fallback
    const basePrices = flight.priceConfig || {
      economy: flight.price || 0,
      business: flight.price || 0,
      first: flight.price || 0
    };

    const totalPrice = basePrices[seatClass] * seatsRequested;

    const booking = await Booking.create({
      user: req.user._id,
      flight: flightId,
      date,
      passengers,
      seatClass,
      totalPrice
    });

    //  Update seats safely
    seatsForDate[seatClass] -= seatsRequested;

    flight.seatsByDate.set(dateKey, seatsForDate);
    await flight.save();

    res.status(201).json({ success: true, booking });

  } catch (error) {
    console.error(error); // IMPORTANT for debugging
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.'
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