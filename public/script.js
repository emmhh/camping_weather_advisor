// script.js

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("getDataBtn").addEventListener("click", fetchData);
  document.getElementById("fetchApiDataBtn").addEventListener("click", fetchPublicApiData);
});

// Function to fetch data from the public APIs directory
function fetchPublicApiData() {
  d3.json("https://api.publicapis.org/entries")
    .then(function (data) {
      // Assuming the data has an 'entries' array
      const entries = data.entries.slice(0, 5); // Limit to 5 for demonstration
      const displayElement = d3.select("#apiDataDisplay").html(""); // Clear previous results
      
      entries.forEach((entry) => {
        displayElement
          .append("div")
          .classed("api-entry", true)
          .html(`<strong>${entry.API}</strong> - ${entry.Description}<br>Auth: ${entry.Auth || "None"}<br>`);
      });
    })
    .catch((error) => {
      console.error("Error fetching public API data:", error);
      d3.select("#apiDataDisplay").text("Failed to load public API data");
    });
}

function fetchData() {
  // Determine the base URL based on the environment
  const baseUrl = "https://campingapp.glitch.me/"

  d3.json(`${baseUrl}/api/place_to_travel`)
    .then(renderDataWithD3)
    .catch((error) => {
      console.error("Error fetching data:", error);
      d3.select("#dataDisplay").text("Failed to load data");
    });
}

function renderDataWithD3(data) {
  const displayElement = d3.select("#dataDisplay");
  displayElement.html(""); // Clear previous results

  data.forEach((item, index) => {
    const dateString = `${item.forecastDate.year.low}-${item.forecastDate.month.low}-${item.forecastDate.day.low}`; //date
    const locationString = `Best Location: ${item.BestLocation}`;
    const sunriseTimeString = `Sunrise Time: ${item.SunriseTime.hour.low}:${item.SunriseTime.minute.low}:${item.SunriseTime.second.low}`;
    const maxFavorableHoursString = `Max Favorable Hours: ${item.MaxFavorableHours.low}`;
    const zipCodeString = `Zip Code: ${item.ZipCode}`;

    // Create the card element using D3
    const card = displayElement
      .append("div")
      .classed("card mb-3 d-flex flex-row", true) // Add flex-row for side-by-side layout
      .style("max-width", "1500px");

    // Data column
    const dataCol = card.append("div").classed("col-md-6", true);
    const cardBody = dataCol.append("div").classed("card-body", true);

    // Add text content to data column
    cardBody.append("h5").classed("card-title", true).text(dateString);
    cardBody
      .append("p")
      .classed("card-text", true)
      .html(
        `${locationString}<br>${sunriseTimeString}<br>${maxFavorableHoursString}<br>${zipCodeString}`
      );

    // Map column
    const mapCol = card.append("div").classed("col-md-6", true);
    mapCol
      .append("div")
      .attr("id", `map-${index}`)
      .classed("map", true)
      .style("height", "250px");

    // Initialize the map after DOM elements are loaded
    setTimeout(
      () => initializeMap(`map-${index}`, item.Latitude, item.Longitude),
      100
    );

    // Add buttons to data column
    cardBody
      .append("button")
      .classed("btn btn-primary btn-sm", true)
      .attr("id", "fetchWeather")
      .style("margin-right", "5px")
      .text("Get Forecast")
      .on("click", function() { // 直接在按钮上绑定点击事件
        console.log(`Fetching weather info : https://campingapp.glitch.me/api/weather/${item.ZipCode}`);
        fetch(`https://campingapp.glitch.me/api/weather/${item.ZipCode}`)
          .then(response => response.json())
          .then(data => displayWeatherData(data))
          .catch(error => console.error('Error fetching weather data:', error));
        });
    cardBody
      .append("button")
      .classed("btn btn-primary btn-sm get-recommendation", true)
      .attr("data-zip", item.ZipCode)
      .text("Get Recommendation");
  });

  initializeRecommendationButtons();
}



function initializeRecommendationButtons() {
  document.querySelectorAll('.get-recommendation').forEach(button => {
    button.removeEventListener('click', recommendationButtonClickHandler); 
    button.addEventListener('click', recommendationButtonClickHandler);
  });
}

function recommendationButtonClickHandler(event) {
    const zipCode = event.target.getAttribute('data-zip');
    const button = event.target;
    const parentElement = button.closest('.card-body');
    let recContainer = parentElement.querySelector('.recommendation-container');

    // Check if recommendations are already displayed
    if (recContainer) {
        // Toggle visibility
        recContainer.style.display = recContainer.style.display === 'none' ? 'flex' : 'none';
    } else {
        // If not already displayed, fetch and display recommendations
        fetchUmbrellaAdviceAndDisplay(zipCode);
    }
}

function fetchUmbrellaAdviceAndDisplay(zipCode) {
  fetch(`https://campingapp.glitch.me/api/umbrella_advice/${zipCode}`)
    .then(response => response.json())
    .then(data => displayRecommendation(data, zipCode))
    .catch(error => console.error('Error fetching umbrella advice:', error));
}

function displayRecommendation(recommendations, zipCode) {
    const button = document.querySelector(`.get-recommendation[data-zip="${zipCode}"]`);
    const parentElement = button.closest('.card-body');
  
    let recContainer = parentElement.querySelector('.recommendation-container');
    if (recContainer) {
        parentElement.removeChild(recContainer);
    }
    recContainer = document.createElement('div');
    recContainer.className = 'recommendation-container';
    parentElement.appendChild(recContainer);

    const sunnyUrl = "https://cdn.glitch.global/879199ed-903c-411c-a2f2-0aafafbe80a4/Sun-icon-creative-design-by-LeisureProjects.jpg?v=1712632705961";
    const unsunnyUrl = "https://cdn.glitch.global/879199ed-903c-411c-a2f2-0aafafbe80a4/360_F_228405554_RT8EeWkQPclTGqZ4xbNbC8XyofP2BZbS.jpg?v=1712632856618";

    let currentDate = new Date();
    let cardMap = new Map();

    recommendations.forEach(rec => {
        if (rec.timeRange === 'Morning') {
            currentDate.setDate(currentDate.getDate() + 1);
        }
        const dateString = currentDate.toISOString().split('T')[0];

        if (!cardMap.has(dateString)) {
            cardMap.set(dateString, []);
        }
        cardMap.get(dateString).push(rec);
    });

    cardMap.forEach((recs, date) => {
        const cardHtml = recs.map(rec => {
            const imagePath = rec.UmbrellaAdvice === "Bring umbrella" ? unsunnyUrl : sunnyUrl;
            return `
                <div style="margin-bottom: 10px;">
                    <h5>Time Range: ${rec.timeRange}</h5>
                    <p>Avg. Precip Prob: ${rec.avgPrecipProb}%</p>
                    <p>Umbrella Advice: ${rec.UmbrellaAdvice}</p>
                    <img src="${imagePath}" alt="${rec.UmbrellaAdvice}" style="width:100px;height:auto;">
                </div>
            `;
        }).join('');

        recContainer.innerHTML += `
            <div class="weather-card" style="display: flex; flex-direction: column; align-items: center; margin: 5px;">
                <h4>Date: ${date}</h4>
                ${cardHtml}
            </div>
        `;
    });

    recContainer.style.display = 'flex';
    recContainer.style.flexWrap = 'wrap';
    recContainer.style.justifyContent = 'center';
    recContainer.style.gap = '10px';
    recContainer.dataset.initialized = 'true';
    recContainer.style.display = 'flex';
}

initializeRecommendationButtons();


function initializeMap(mapId, latitude, longitude) {
  const map = new google.maps.Map(document.getElementById(mapId), {
    zoom: 10,
    center: { lat: latitude, lng: longitude },
  });

  // Add a mark
  new google.maps.Marker({
    position: { lat: latitude, lng: longitude },
    map: map,
    title: "Your Location",
  });
}


  
function displayWeatherData(data) {
  console.log(data)
  const weatherContainer = document.getElementById('weatherData');
  weatherContainer.innerHTML = ''; // Clear previous data
  if (data.length > 0) {
      weatherContainer.style.display = 'flex'; 
      data.forEach(day => {
          const forecastDate = `${day.forecastDate.year.low}-${String(day.forecastDate.month.low).padStart(2, '0')}-${String(day.forecastDate.day.low).padStart(2, '0')}`;
          const card = document.createElement('div');
          card.className = 'weather-card';
          card.innerHTML = `
          <h4>Date: ${forecastDate}</h4>
          <p>ZipCode: ${day.ZipCode}</p>
          <p>Avg. Temp.: ${parseFloat(day.AverageTemperature).toFixed(1)}°C</p>
          <p>Visibility: ${day.VisibilityCategory}</p>
          <p>Cloud Cover: ${day.CloudCoverCategory}</p>
          <p>Viewing Possibility: ${day.ViewingPossibility}</p>
          `;
          weatherContainer.appendChild(card);
      });
  }
}

document.querySelectorAll('.get-recommendation').forEach(button => {
  button.addEventListener('click', handleRecommendationClick);
});
