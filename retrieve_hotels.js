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
async function searchHotels(cityCode, checkInDate, checkOutDate, adults, roomQuantity) {
    const token = await getAccessToken();

    const url = new URL("https://api.amadeus.com/v2/shopping/hotel-offers");
    url.searchParams.set("cityCode", cityCode);         // e.g., LAX, NYC
    url.searchParams.set("checkInDate", checkInDate);   // YYYY-MM-DD
    url.searchParams.set("checkOutDate", checkOutDate); // YYYY-MM-DD
    url.searchParams.set("adults", adults);             
    url.searchParams.set("roomQuantity", roomQuantity);

    const res = await fetch(url.toString(), {
        headers: {Authorization: `Bearer ${token}`}
    });
    
    const data = await res.json();
    if (!data) {
       return [];
    }

    return data.data;
}

// Microservice endpoint
app.get('/hotels', async(req,res) => {
    const { cityName, checkIn, checkOut, adults, rooms} = req.query;

    try {
        const token = await getAccessToken();
        const city = await resolveCityToIATACode(cityName, token);

        const hotels = await searchHotels(cityCode, checkIn, checkOut, adults, rooms, token);

        res.json({
            hotel_count: hotels.length,
            hotels: hotels
        });
    } catch (error) {
         res.status(500).json({ error: "Internal server error" });
    }
});

// Listen for request 
app.listen(PORT, () => {
  console.log(`Hotel microservice running on http://localhost:${PORT}`);
});