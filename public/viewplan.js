// Log for confirming the itinerary number
console.log("Current Itinerary:" + localStorage.getItem("curr_itinerary"))

// Functions for opening/closing the help modal
function openModal() {
    document.getElementById("helpModal").style.display = "block";
}
function closeModal() {
    document.getElementById("helpModal").style.display = "none";
}
window.onclick = function(event) {
    const helpModal = document.getElementById("helpModal");
    const exchangeModal = document.getElementById("exchangeModal");

    if (event.target === helpModal) {
        helpModal.style.display = "none";
    }

    if (event.target === exchangeModal) {
        closeExchangeModal();
    }
};

// Functions for opening/closing the currency exchange modal
function openExchangeModal() {
    document.getElementById("exchangeModal").style.display = "block";
}
function closeExchangeModal() {
    document.getElementById("exchangeModal").style.display = "none";
    document.getElementById("fromCurrency").value = "";
    document.getElementById("toCurrency").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("convertedResult").innerText = "";
}

// Function for converting the currency 
async function convertCurrency() {
    // Get the required parameters from the user 
    const from = document.getElementById("fromCurrency").value.trim().toUpperCase();
    const to = document.getElementById("toCurrency").value.trim().toUpperCase();
    const amount = parseFloat(document.getElementById("amount").value);
    
    // Result div where the conversion result will appear
    const resultDiv = document.getElementById("convertedResult");

    // If one of the required fields is missing / in an incorrect form 
    if (!from || !to) {
        resultDiv.innerText = "Please enter valid currencies";
        return;
    } else if (isNaN(amount)) {
        resultDiv.innerText = "Enter a number for the conversion please";
        return;
    } 
    resultDiv.innerText = "Converting...";

    const url = `http://localhost:5002/convert?from=${from}&to=${to}&amount=${amount}`;
    try {
        // Retrieve the response from the converter microservice
        const response = await fetch(url, { method: "GET", timeout: 15000 });
        if (!response.ok) {
            const errorData = await response.json();
            console.log(errorData)
        }

        // Gather the conversion data from the microservice, parse the text and send it to the div
        const data = await response.json();
        resultDiv.innerText = `
          ${data.original_amount} ${data.from_currency} = ${data.converted_amount} ${data.to_currency}
          (Rate: ${data.exchange_rate})
        `.trim();
    } catch (error) {
        console.error("Conversion error:", error);
        resultDiv.innerText = "Failed to connect to conversion service."
    }

}

// Function for returning the user to the welcome screen
function returnHome() {
    window.location.href = "welcome_view.html";
}

document.addEventListener("DOMContentLoaded", () => {
    const itineraryKey = localStorage.getItem("curr_itinerary");

    // Hotel raw information
    const hotelRaw = localStorage.getItem("itinerary" + itineraryKey + "_hotel");

    // If a hotel has been chosen 
    if (hotelRaw) {
          try {
            const hotel = JSON.parse(hotelRaw);
            document.getElementById("hotelinfo").innerText = `${hotel.name || "Unknown"}`;
        } catch (e) {
            console.error("Failed to parse hotel data:", e);
            document.getElementById("hotelinfo").innerText = "Hotel information unavailable";
        }
    } else {
        document.getElementById("hotelinfo").innerText = "No hotel selected yet."
    }

    // Departure / Arrival flight raw information
    const depRaw = localStorage.getItem("itinerary" + itineraryKey + "_flightdep");
    const arrivRaw = localStorage.getItem("itinerary" + itineraryKey + "_flightarriv");

    // If a flight has been chosen (with both the departure and arrival chosen)
    if (depRaw && arrivRaw) {
        try {
            // Attempt to parse the flight information
            const dep = JSON.parse(depRaw);
            const arriv = JSON.parse(arrivRaw);

            // Format time 
            const formatTime = (iso) => {
                const date = new Date(iso);
                return date.toLocaleString(undefined, {
                    weekday: "short", year: "numeric", month: "short", day: "numeric",
                    hour: "2-digit", minute: "2-digit"
                });
            };

            // Define departure / arrival text
            const depText = `
                Outbound Flight:
                Airline: ${dep.airline}
                From: ${dep.from} at ${formatTime(dep.fromTime)}
                To: ${dep.to} at ${formatTime(dep.toTime)}
                Price: $${dep.price}
            `.trim();
            const arrivText = `
                Return Flight:
                Airline: ${arriv.airline}
                From: ${arriv.from} at ${formatTime(arriv.fromTime)}
                To: ${arriv.to} at ${formatTime(arriv.toTime)}
                Price: $${arriv.price}
            `.trim();

            // Set the element text to the parsed flight information
            document.getElementById("flightinfo").innerText = `${depText}\n\n${arrivText}`;
        } catch (e) {
            // An error occured parsing the flight information
            console.error("Failed to parse flight data:", e);
            document.getElementById("flightinfo").innerText = "Error loading flight information.";
        }
    } else {
        // No flight has been chosen yet
        document.getElementById("flightinfo").innerText = "No flights selected yet.";
    }
});
