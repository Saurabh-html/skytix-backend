const Flight = require('../models/flightModel');

// CREATE FLIGHT
const createFlight = async (req, res) => {
  try {
    const flight = await Flight.create({
      ...req.body,
      seatsByDate: {},
      cancelledDates: []
    });

    res.status(201).json(flight);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// BULK CREATE
const bulkCreateFlights = async (req, res) => {
  try {
    const { baseFlightNumber, count, ...rest } = req.body;

    let flights = [];

    for (let i = 0; i < count; i++) {
      flights.push({
        ...rest,
        flightNumber: `${baseFlightNumber}-${i + 1}`,
        seatsByDate: {},
        cancelledDates: []
      });
    }

    await Flight.insertMany(flights);

    res.json({ message: `${count} flights created successfully` });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET FLIGHTS
const getFlights = async (req, res) => {
  try {
    const { from, to, date } = req.query;

    let query = {};

    if (from) query.from = { $regex: from, $options: 'i' };
    if (to) query.to = { $regex: to, $options: 'i' };

    let flights = await Flight.find(query);

    let dateKey = date
      ? new Date(date).toISOString().split('T')[0]
      : null;

    if (date) {
      const selectedDay = new Date(date).getDay();

      flights = flights.filter(f => {
        if (f.scheduleType === 'weekly' && !f.daysOfWeek.includes(selectedDay)) {
          return false;
        }

        if (f.cancelledDates.includes(dateKey)) {
          return false;
        }

        return true;
      });
    }

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

    res.json({ flights: updatedFlights });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE FLIGHT ✅ NEW
const deleteFlight = async (req, res) => {
  try {
    await Flight.findByIdAndDelete(req.params.id);
    res.json({ message: 'Flight deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CANCEL FULL
const cancelFlight = async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);

    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    flight.status = 'cancelled';
    await flight.save();

    res.json({ message: 'Flight cancelled' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CANCEL BY DATE
const cancelFlightByDate = async (req, res) => {
  try {
    const { date } = req.body;

    const flight = await Flight.findById(req.params.id);

    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    const dateKey = new Date(date).toISOString().split('T')[0];

    if (!flight.cancelledDates.includes(dateKey)) {
      flight.cancelledDates.push(dateKey);
    }

    await flight.save();

    res.json({ message: 'Flight cancelled for selected date' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createFlight,
  getFlights,
  cancelFlight,
  bulkCreateFlights,
  cancelFlightByDate,
  deleteFlight
};