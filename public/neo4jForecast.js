document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('fetchWeather').addEventListener('click', function() {
    console.log("Fetching weather info...")
    const zipCode = document.getElementById('zipCodeSelector').value;
    fetch(`https://campingapp.glitch.me/api/weather/${zipCode}`)
      .then(response => response.json())
      .then(data => displayWeatherData(data))
      .catch(error => console.error('Error fetching weather data:', error));
  });
});
  
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
  