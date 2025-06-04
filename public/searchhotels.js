async function connectToMicroserviceB(params) {
    const url = `http://localhost:5003/hotels?${params.toString()}`;
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
        return data.hotels;

    } catch (error) {
        console.error("Failed to fetch hotel data:", error);
        return null;
    }
}

function displayHotelOptions() {
    console.log("display options here");
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
        const hotels = await connectToMicroserviceB(params);

        // Display options to user
        displayHotelOptions(hotels);
    });
});