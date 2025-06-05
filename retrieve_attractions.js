const axios = require("axios");
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

require('dotenv').config();
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const app = express();
const PORT = 5004;
app.use(cors())

// Get lat/lng for a city using Geocoding API
async function getCoordinatesFromCity(cityName) {
  const url = 'https://maps.googleapis.com/maps/api/geocode/json';
  try {
    // Attempt to access the API to convert the city name into lng/lat coordiantes
    const response = await axios.get(url, {
      params: {
        address: cityName,
        key: GOOGLE_API_KEY
      }
    });

    // If successful response, return the lng/lat, otherwise print error
    if (response.data.status === 'OK') {
      const location = response.data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    } else {
      throw new Error(`Geocoding API failed: ${response.data.status}`);
    }
  } catch (error) {
    throw new Error(`Error in getCoordinatesFromCity: ${error.message}`);
  }
}

// Get tourist attractions nearby using Places API
// NOTE: radius is how far it will look for attractions, made default 5000 meters
async function getAttractions(lat, lng, radius = 5000) {
  const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
  try {
    // Find 'tourist attractions' in the lat/lng 
    const response = await axios.get(url, {
      params: {
        location: `${lat},${lng}`,
        radius: radius,
        type: 'tourist_attraction',
        key: GOOGLE_API_KEY
      }
    });

    // If successful response, return the data, otherwise print error
    if (response.data.status === 'OK') {
      return response.data.results.map(place => ({
        name: place.name,
        address: place.vicinity,
        rating: place.rating || 'N/A'
      }));
    } else {
      throw new Error(`Places API failed: ${response.data.status}`);
    }
  } catch (error) {
    throw new Error(`Error in getAttractions: ${error.message}`);
  }
}

// Main function for finding attractions in a city
async function findAttractionsInCity(city) {
  try {
    // Gather the lat/lng given the city name
    const { lat, lng } = await getCoordinatesFromCity(city);
    // Helper function to get the attractions
    const attractions = await getAttractions(lat, lng);

    // Console.log each attraction with its rating
    attractions.forEach((place, index) => {
      console.log(`${index + 1}. ${place.name} — ${place.address} — ${place.rating}/5`);
    });

  } catch (error) {
    console.error(error.message);
  }
}

// Endpoint: /attract
app.get('/attract', async (req, res) => {
    const cityName = req.query.city;

    try {
        await findAttractionsInCity(cityName);
        
        res.json({
            success: true,
            message: `Successfully retrieved attractions for ${cityName}`
        });
    } catch (error) {
        console.error("Error finding attractions: " + error);
        res.status(500).json({error: "Internal server error"});
    }

});

// Start server
app.listen(PORT, () => {
  console.log(`Hotel microservice running on http://localhost:${PORT}`);
});