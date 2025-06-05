// Function for connecting to the microservice to find hotels
//async function connectToMicroserviceB(params) {
async function connectToMicroserviceB(cityName) {
    // Connection URL
    //const url = `http://localhost:5003/hotels?${params.toString()}`;
    const url = `http://localhost:5003/hotels?cityName=${cityName}`;
    try {
        const response = await fetch(url, {
        method: 'GET'
        });

        if (!response.ok) {
        const errorData = await response.json();
        console.error("Hotel search error:", errorData);
        return null;
        }

        const data = await response.json();
        console.log(`Found ${data.hotel_count} hotels`);
        // Return hotels found
        return data.hotels;
    // Connection to microservice failed
    } catch (error) {
        console.error("Failed to fetch hotel data:", error);
        return null;
    }
}

// Function for displaying the hotel options to the user
async function displayHotelOptions(hotels) {
  let results = document.getElementById("results");
  // Create the results DIV container if it does not yet exist
  if (!results) {
    results = document.createElement("div");
    results.id = "results";
    document.querySelector(".form-container").appendChild(results);
  }

  results.innerHTML = "<p>Searching hotels...</p>";

  // If no results are returned, no hotels are available in that area
  if (!hotels || hotels.length === 0) {
    results.innerHTML = "<p>No hotels found.</p>";
    return;
  }
  results.innerHTML = ""; 

  // List the first 20 hotel options
  hotels.slice(0, 20).forEach(hotel => {
    const card = document.createElement("div");
    card.className = "hotel-card";

    const name = document.createElement("h3");
    name.textContent = hotel.name || "Unnamed Hotel";
    card.appendChild(name);

    if (hotel.address) {
      const address = document.createElement("p");
      address.textContent = [
        ...(hotel.address.lines || []),
        hotel.address.cityName,
        hotel.address.postalCode
      ].filter(Boolean).join(", ");
      card.appendChild(address);
    }

    const price = document.createElement("p");
    price.textContent = (hotel.price && hotel.currency) 
      ? `Price: ${hotel.price} ${hotel.currency}` 
      : "Price: Not available";
    card.appendChild(price);

    // Create the "Choose Hotel" button
    const chooseBtn = document.createElement("button");
    chooseBtn.textContent = "Choose Hotel";
    chooseBtn.addEventListener("click", () => {
        // Store chosen hotel info in localStorage
        const itineraryKey = localStorage.getItem("curr_itinerary");
        localStorage.setItem("itinerary" + itineraryKey + "_hotel", JSON.stringify(hotel));
        window.location.href = "viewplan.html";
    });

    card.appendChild(chooseBtn);
    results.appendChild(card);
  });
}


// On page load
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("hotelSearchForm");
    if (!form) {
        console.error("Flight search form not found.");
        return;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        // Gather text from form submission, put into parameter list
        const city = document.getElementById("city").value.trim();
        const startDate = document.getElementById("startDate").value;
        const endDate = document.getElementById("endDate").value;
        const adultNum = document.getElementById("adultNum").value;
        const roomNum = document.getElementById("roomNum").value;

        const params = new URLSearchParams({
            cityName: city,
            checkIn: startDate,
            checkOut: endDate,
            adults: adultNum,
            rooms: roomNum
        });
        
        // Connect to microservice
        const hotels = await connectToMicroserviceB(city); // change back to params

        // Display options to user
        displayHotelOptions(hotels);
    });
});