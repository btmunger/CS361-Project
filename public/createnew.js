document.addEventListener("DOMContentLoaded", function () {
    // Get the itinerary form element and the current itinerary number
    const form = document.querySelector("form");
    const curr_itinerary = localStorage.getItem("curr_itinerary");

    // When the form is submitted...
    form.addEventListener("submit", function (event) {
        event.preventDefault();

        // Get the title/description for the itinerary, save to local storage
        localStorage.setItem("itinerary" + curr_itinerary, document.getElementById("title").value);
        localStorage.setItem("itinerary" + curr_itinerary + "_desc", document.getElementById("description").value);

        // Redirect user to viewplan page
        window.location.href = "viewplan.html";
    });
});