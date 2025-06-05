// Empty flight cookies if change flight is requested
localStorage.setItem("itinerary" + localStorage.getItem("curr_itinerary") + "_flightdep", "");
localStorage.setItem("itinerary" + localStorage.getItem("curr_itinerary") + "_flightarriv", "");

// Function to check if input is a valid IATA code
function isIATACode(input) {
  return /^[A-Z]{3}$/i.test(input.trim());
}

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

// Cache airline names
const airlineNameCache = {};

async function getAirlineName(code, token) {
  if (airlineNameCache[code]) return airlineNameCache[code];

  const res = await fetch(`https://api.amadeus.com/v1/reference-data/airlines?airlineCodes=${code}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  let name = data.data?.[0]?.businessName || code;

  // Check if airline name is something like "AMADEUS SIX" or an invalid name
  if (name.includes("AMADEUS") || name === "N/A") {
    // Fallback to a more appropriate value
    name = "Unknown Airline";  
  }

  airlineNameCache[code] = name;
  return name;
}


// Convert city or code to strict IATA code
async function resolveToIATACode(input, token) {
  if (isIATACode(input)) return input.toUpperCase();

  const res = await fetch(
    `https://api.amadeus.com/v1/reference-data/locations?keyword=${encodeURIComponent(input)}&subType=AIRPORT&view=FULL`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  const data = await res.json();
  if (!data?.data?.length) return null;

  // Match exactly by city
  const matchesCity = data.data.find(loc =>
    loc.address?.cityName?.toLowerCase() === input.toLowerCase()
  );

  return matchesCity?.iataCode || null;
}

// Function for converting the EUR price to USD
async function getUSDPrice(eurPrice) {
  const url = `http://localhost:5002/convert?from=EUR&to=USD&amount=${eurPrice}`;

  try {
        // Retrieve the response from the converter microservice
        const response = await fetch(url, { method: "GET", timeout: 15000 });
        if (!response.ok) {
            const errorData = await response.json();
            console.log(errorData)
        }

        // Gather the conversion data from the microservice, parse the text and send it to the div
        const data = await response.json();
        return data.converted_amount;
  } catch (error) {
        console.error("Conversion error:", error);
        return null;
  }
}

// Search and display flights
async function searchFlights({ origin, destination, date, containerId, label }) {
  const token = await getAccessToken();

  const url = new URL("https://api.amadeus.com/v2/shopping/flight-offers");
  url.searchParams.set("originLocationCode", origin);
  url.searchParams.set("destinationLocationCode", destination);
  url.searchParams.set("departureDate", date);
  url.searchParams.set("adults", "1");
  url.searchParams.set("max", "50");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  const container = document.getElementById(containerId);
  container.innerHTML += `<h2>${label}</h2>`;

  if (!data.data || data.data.length === 0) {
    container.innerHTML += "<p>No flights found.</p>";
    return;
  }

  const airlineCounts = {};
  let shown = 0;

  for (const offer of data.data) {
    if (shown >= 20) break;

    // Check if flight is direct (only 1 segment)
    const segments = offer.itineraries[0].segments;
    if (segments.length > 1) continue;  // Skip if more than 1 segment (not direct)

    const segment = segments[0];
    const airline = segment.operating?.carrierCode || segment.carrierCode;

    airlineCounts[airline] = (airlineCounts[airline] || 0) + 1;
    if (airlineCounts[airline] > 7) {
      shown--;
      continue;
    }

    const airlineName = await getAirlineName(airline, token);

    // Skip flights with "Unknown Airline"
    if (airlineName === "Unknown Airline") {
      continue; 
    }

    // API returns prices in EUR, convert to USD using microservice
    const usdPrice = await getUSDPrice(offer.price.total);
    const price = usdPrice !== undefined ? usdPrice.toFixed(2) : "Unavailable";

    const div = document.createElement("div");
    div.className = "flight-offer";
    div.innerHTML = `
      <p><strong>Airline:</strong> ${airlineName}</p>
      <p><strong>From:</strong> ${segment.departure.iataCode} at ${segment.departure.at}</p>
      <p><strong>To:</strong> ${segment.arrival.iataCode} at ${segment.arrival.at}</p>
      <p><strong>Price:</strong> $${price} USD</p>
      <button class="select-flight-btn">Select</button>
      <hr/>
    `;

    const flightData = {
      airline: airlineName,
      from: segment.departure.iataCode,
      fromTime: segment.departure.at,
      to: segment.arrival.iataCode,
      toTime: segment.arrival.at,
      price: price
    };
    
    div.querySelector(".select-flight-btn").addEventListener("click", () => {
      const key = label.includes("Return") ? "itinerary" + localStorage.getItem("curr_itinerary") + "_flightarriv" : "itinerary" + localStorage.getItem("curr_itinerary") + "_flightdep";
      localStorage.setItem(key, JSON.stringify(flightData));
    
      // Check if both are selected
      const dep = localStorage.getItem("itinerary" + localStorage.getItem("curr_itinerary") + "_flightdep");
      const ret = localStorage.getItem("itinerary" + localStorage.getItem("curr_itinerary") + "_flightarriv");
    
      if (dep.length > 0 && ret.length > 0) {
        // Redirect to view page
        window.location.href = "viewplan.html";  
      } else {
        alert(`${label} selected! Now select the ${label.includes("Return") ? "departure" : "return"} flight.`);
      }
    });
    

    container.appendChild(div);
    shown++;
  }
}

// On page load
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("flightSearchForm");
  if (!form) {
    console.error("Flight search form not found.");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const originInput = document.getElementById("departureCity").value.trim();
    const destinationInput = document.getElementById("arrivalCity").value.trim();
    const departureDate = document.getElementById("departureDate").value;
    const returnDate = document.getElementById("returnDate").value;

    const token = await getAccessToken();
    const originCode = await resolveToIATACode(originInput, token);
    const destinationCode = await resolveToIATACode(destinationInput, token);

    if (!originCode || !destinationCode) {
      alert("Could not resolve one or both airport/city inputs.");
      return;
    }

    // Create results container
    let results = document.getElementById("results");
    if (!results) {
      results = document.createElement("div");
      results.id = "results";
      document.querySelector(".form-container").appendChild(results);
    }

    results.innerHTML = "<p>Searching flights...</p>";

    await searchFlights({
      origin: originCode,
      destination: destinationCode,
      date: departureDate,
      containerId: "results",
      label: "Select Your Departure Flight"
    });

    if (returnDate) {
      let returnDiv = document.getElementById("returnResults");
      if (!returnDiv) {
        returnDiv = document.createElement("div");
        returnDiv.id = "returnResults";
        results.appendChild(returnDiv);
      }
      await searchFlights({
        origin: destinationCode,
        destination: originCode,
        date: returnDate,
        containerId: "returnResults",
        label: "Select Your Return Flight"
      });
    }
  });
});
