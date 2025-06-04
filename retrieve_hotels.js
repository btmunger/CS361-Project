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
      client_secret: "ctkPbIP9YRPfGG60"
    })
  });
  const data = await res.json();
  return data.access_token;
}

// Resolve city name to IATA city code
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

// Get hotels by geocode (latitude, longitude)
async function getHotelsByCity(cityCode, token) {
  const url = new URL("https://api.amadeus.com/v1/reference-data/locations/hotels/by-city");
  url.searchParams.set("cityCode", cityCode);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();

  if (!data || !data.data || data.data.length === 0) {
    return [];
  }

  return data.data;
}


// Get hotel offers (prices) by hotelId and date info
async function getHotelOffersForHotels(hotelIds, checkInDate, checkOutDate, adults, rooms, token) {
  const offersMap = {};

  // Chunk into batches of 20
  for (let i = 0; i < hotelIds.length; i += 20) {
    const batch = hotelIds.slice(i, i + 20);
    const url = new URL("https://api.amadeus.com/v2/shopping/hotel-offers");
    url.searchParams.set("hotelIds", batch.join(","));
    url.searchParams.set("checkInDate", checkInDate);
    url.searchParams.set("checkOutDate", checkOutDate);
    url.searchParams.set("adults", adults.toString());
    url.searchParams.set("roomQuantity", rooms.toString());

    try {
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (data.errors || !data.data) {
        console.error("Error in hotel offers batch:", data.errors || data);
        continue;
      }

      for (const hotelOffer of data.data) {
        const hotelId = hotelOffer.hotel.hotelId;
        const offer = hotelOffer.offers && hotelOffer.offers[0];
        if (offer && offer.price) {
          offersMap[hotelId] = {
            price: offer.price.total,
            currency: offer.price.currency
          };
        }
      }
    } catch (err) {
      console.error("Error fetching hotel offers:", err);
    }
  }

  return offersMap;
}

app.get('/hotels', async (req, res) => {
  const { cityName, checkIn, checkOut, adults = 1, rooms = 1 } = req.query;

  try {
    const token = await getAccessToken();

    // Step 1: Get IATA code for city
    const cityCode = await resolveCityToIATACode(cityName, token);
    if (!cityCode) {
      return res.status(400).json({ error: "Invalid city name" });
    }

    // Step 2: Get hotels near the city
    const hotels = await getHotelsByCity(cityCode, token);
    if (hotels.length === 0) {
      return res.status(404).json({ error: "No hotels found in city" });
    }

    // Step 3: Get all hotel IDs
    const hotelIds = hotels.map(h => h.hotelId);

    // Step 4: Call once to get all hotel offers
    const offersMap = await getHotelOffersForHotels(
      hotelIds,
      checkIn,
      checkOut,
      adults,
      rooms,
      token
    );

    // Step 5: Merge offers back into hotels
    const hotelsWithPrices = hotels.map(hotel => {
      const offer = offersMap[hotel.hotelId];
      return {
        name: hotel.name,
        hotelId: hotel.hotelId,
        address: hotel.address,
        price: offer?.price ?? null,
        currency: offer?.currency ?? null,
      };
    });

    res.json({
      hotel_count: hotelsWithPrices.length,
      hotels: hotelsWithPrices
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
