document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");

    const curr_itinerary = localStorage.getItem("curr_itinerary");

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        localStorage.setItem("itinerary" + curr_itinerary, document.getElementById("title").value);
        localStorage.setItem("itinerary" + curr_itinerary + "_desc", document.getElementById("description").value);

        window.location.href = "https://web.engr.oregonstate.edu/~mungerbr/travelproj/viewplan.html";
    });
});