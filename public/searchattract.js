// Function for saving attractions to the list
async function saveAttraction(attraction) {
    // Connection URL
    const url = `http://localhost:5005/saveattract?attraction=${encodeURIComponent(JSON.stringify(attraction))}`;

    try {
        const response = await fetch(url, {
        method: 'GET'
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Attraction save error:", errorData);
            return null;
        }

        const data = await response.json();
       
        if (data.success) {
            console.log("Successfully saved attraction via microservice.");
        }
    // Connection to microservice failed
    } catch (error) {
        console.error("Failed to fetch and save attraction data:", error);
        return null;
    }
}

// Function for displaying the retrieved attractions to the user for them to choose from
async function displayAttractions(attractions) {
    let results = document.getElementById("results");

    // Create the results container if it doesn't exist yet
    if (!results) {
        results = document.createElement("div");
        results.id = "results";
        document.querySelector(".form-container").appendChild(results);
    }

    results.innerHTML = "<p>Searching attractions...</p>";

    // Handle empty or missing results
    if (!attractions || attractions.length === 0) {
        results.innerHTML = "<p>No attractions found.</p>";
        return;
    }

    results.innerHTML = "";

    // Show up to 20 attractions
    attractions.slice(0, 20).forEach(attraction => {
        const card = document.createElement("div");
        card.className = "hotel-card"; // Reuse the same CSS style for consistency

        const name = document.createElement("h3");
        name.textContent = attraction.name || "Unnamed Attraction";
        card.appendChild(name);

        const address = document.createElement("p");
        address.textContent = attraction.address || "Address not available";
        card.appendChild(address);

        const rating = document.createElement("p");
        rating.textContent = `Rating: ${attraction.rating || "N/A"} / 5`;
        card.appendChild(rating);

        // "Add to Itinerary" button
        const chooseBtn = document.createElement("button");
        chooseBtn.textContent = "Add to Itinerary";

        chooseBtn.addEventListener("click", () => {
            const itineraryKey = localStorage.getItem("curr_itinerary") || "default";
            let savedAttractions = JSON.parse(localStorage.getItem("itinerary_" + itineraryKey)) || [];

            // Prevent duplicates based on name (or any unique identifier)
            if (!savedAttractions.some(a => a.name === attraction.name)) {
                savedAttractions.push(attraction);
                // Save the attraction to the .csv file
                console.log("Attraction saved: " + JSON.stringify(attraction));
                saveAttraction(attraction);
            }

            // Change button state
            chooseBtn.textContent = "Added!";
            chooseBtn.disabled = true;
        });

        card.appendChild(chooseBtn);
        results.appendChild(card);
    });
}

// Function for connecting to the microservice to find attractions
async function connectToMicroserviceC(cityName){
    // Connection URL
    const url = `http://localhost:5004/attract?city=${cityName}`; 
    try {
        const response = await fetch(url, {
        method: 'GET'
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Attraction search error:", errorData);
            return null;
        }

        const data = await response.json();
       
        if (data.success) {
            displayAttractions(data.attractions);
        }
    // Connection to microservice failed
    } catch (error) {
        console.error("Failed to fetch attraction data:", error);
        return null;
    }
}

// Function for loading the saved attractions
async function loadSavedAttractions() {
    const url = `http://localhost:5005/viewattract`; 

    try {
        const response = await fetch(url, {
            method: 'GET'
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error fetching saved attractions:", errorData);
            return null;
        }

        const data = await response.json();

        if (!data.success) {
            console.error("Server returned unsuccessful response.");
            return;
        }

        const attractions = data.attractions;

        const results = document.getElementById('results') || (() => {
            const el = document.createElement("div");
            el.id = "results";
            document.querySelector(".form-container").appendChild(el);
            return el;
        })();

        results.innerHTML = ''; 

        attractions.forEach(attraction => {
            const card = document.createElement("div");
            card.className = "hotel-card";

            card.innerHTML = `
                <h3>${attraction.name}</h3>
                <p>${attraction.address}</p>
                <p>Rating: ${attraction.rating} / 5</p>
            `;

            results.appendChild(card);
        });

    } catch (error) {
        console.error("Error fetching saved attractions:", error);
        return null;
    }
}

// On page load
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("attractSearchForm");
    const viewbtn = document.getElementById("viewbtn");

    if (!form) {
        console.error("Attraction search form not found.");
        return;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const cityName = document.getElementById("city").value.trim();
        connectToMicroserviceC(cityName);
    });

    viewbtn.addEventListener("click", () => {
        loadSavedAttractions();
    });
});