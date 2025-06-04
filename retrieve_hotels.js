const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = 5003;

app.use(cors());
app.use(express.json());

// Get Amadeus Access Token
async function getAccessToken() {
  const res = await fetch("https://api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: "PZQqEu6BvEt7O9e2nBEGAheEzA1CjwdM",
      // API key, would hide in actual production
      client_secret: "ctkPbIP9YRPfGG60" 
    })
  });
  const data = await res.json();
  return data.access_token;
}

async function getHotelIdsByCity(cityCode, token) {
  // First get city geolocation from /locations
  const locationUrl = new URL("https://api.amadeus.com/v1/reference-data/locations");
  locationUrl.searchParams.set("keyword", cityCode);
  locationUrl.searchParams.set("subType", "CITY");

  const locationRes = await fetch(locationUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  });

  const locationData = await locationRes.json();
  if (!locationData || !locationData.data || locationData.data.length === 0) {
    return [];
  }

  const { latitude, longitude } = locationData.data[0].geoCode;

  // Now query nearby hotels by geocode
  const hotelUrl = new URL("https://api.amadeus.com/v1/reference-data/locations/hotels/by-geocode");
  hotelUrl.searchParams.set("latitude", latitude);
  hotelUrl.searchParams.set("longitude", longitude);
  hotelUrl.searchParams.set("radius", 20); // Optional, in KM. Adjust if needed.
  hotelUrl.searchParams.set("radiusUnit", "KM");

  const hotelRes = await fetch(hotelUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  });

  const hotelData = await hotelRes.json();
  console.log("Nearby hotel data:", hotelData);

  if (!hotelData || !hotelData.data || hotelData.data.length === 0) {
    return [];
  }

  return hotelData.data.map(h => h.hotelId);
}


// Convert user entered city to 'city code'
async function resolveCityToIATACode(cityName, token) {
    const url = new URL("https://api.amadeus.com/v1/reference-data/locations");
    url.searchParams.set("keyword", cityName);
    url.searchParams.set("subType", "CITY");

    const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (!data || !data.data || data.data.length === 0) {
        return null;
    }

    return data.data[0].iataCode;
}

// Search hotel deals
async function searchHotelsByIds(hotelIds, checkInDate, checkOutDate, adults, rooms) {
  if (hotelIds.length === 0) {
    throw new Error("No hotelIds provided");
  }

  const token = await getAccessToken();

  const url = new URL("https://api.amadeus.com/v2/shopping/hotel-offers/by-hotel");
  // hotelIds is an array of strings; need to pass them properly (repeated params or JSON string)
  hotelIds.forEach(id => url.searchParams.append("hotelIds", id));
  url.searchParams.set("checkInDate", checkInDate);
  url.searchParams.set("checkOutDate", checkOutDate);
  url.searchParams.set("adults", adults.toString());
  url.searchParams.set("roomQuantity", rooms.toString());

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  if (!data || !data.data) {
    return [];
  }

  return data.data;
}


app.get('/hotels', async (req, res) => {
  const { cityName, checkIn, checkOut, adults = 1, rooms = 1 } = req.query;
  try {
    const token = await getAccessToken();

    // Resolve city name to city code (e.g. LAX)
    const cityCode = await resolveCityToIATACode(cityName, token);
    if (!cityCode) {
      return res.status(400).json({ error: "Invalid city name" });
    }

    // Get hotelIds in city
    const hotelIds = await getHotelIdsByCity(cityCode, token);
    if (hotelIds.length === 0) {
      return res.status(404).json({ error: "No hotels found in city" });
    }

    // Search hotel offers by hotelIds
    const hotels = await searchHotelsByIds(hotelIds, checkIn, checkOut, adults, rooms);

    res.json({
      hotel_count: hotels.length,
      hotels
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Listen for request 
app.listen(PORT, () => {
  console.log(`Hotel microservice running on http://localhost:${PORT}`);
});