const Flight = require('../models/flightModel');

// @desc Create flight
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
      daysOfWeek,
      seatsByDate: {} 
    });

    res.status(201).json(flight);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc Get flights with schedule + date-wise seats
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

    if (from) {
      query.from = { $regex: from, $options: 'i' };
    }

    if (to) {
      query.to = { $regex: to, $options: 'i' };
    }

    let flights = await Flight.find(query);

    let selectedDate = null;

    if (date) {
      selectedDate = new Date(date);
      const selectedDay = selectedDate.getDay();

      flights = flights.filter(flight => {
        if (flight.scheduleType === 'daily') return true;

        if (flight.scheduleType === 'weekly') {
          return flight.daysOfWeek.includes(selectedDay);
        }

        return false;
      });
    }

    //  APPLY DATE-WISE SEATS
    const dateKey = date ? new Date(date).toISOString().split('T')[0] : null;

    const updatedFlights = flights.map(f => {
      let seats = f.seatsAvailable;

      if (dateKey) {
        seats = f.seatsByDate.get(dateKey) ?? f.seatsAvailable;
      }

      return {
        ...f._doc,
        seatsAvailable: seats
      };
    });

    // SORT
    const sortOrder = order === 'asc' ? 1 : -1;

    updatedFlights.sort((a, b) => {
      if (sortBy === 'price') {
        return sortOrder * (a.price - b.price);
      }
      return 0;
    });

    // PAGINATION
    const startIndex = (page - 1) * limit;
    const paginatedFlights = updatedFlights.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      total: updatedFlights.length,
      page: Number(page),
      pages: Math.ceil(updatedFlights.length / limit),
      flights: paginatedFlights
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc Cancel flight (Admin)
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