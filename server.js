// server.js
const cors = require("cors");
const express = require('express');
const neo4j = require('neo4j-driver');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));

// const corsOptions = {
//   origin: 'https://yourfrontenddomain.com', // Replace with your frontend domain
//   optionsSuccessStatus: 200,
//   credentials: true, // If your frontend needs to send credentials like cookies
// };
// app.use(cors(corsOptions));

app.use(cors());
// Setup Neo4j connection
const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD
  )
);

// verify the connection
async function verifyConnection() {
  const session = driver.session();
  try {
    await session.run('MATCH (n) RETURN n LIMIT 1');
    console.log('Successfully connected to Neo4j Aura');
  } catch (error) {
    console.error('Error connecting to Neo4j Aura:', error);
  } finally {
    await session.close();
  }
}

// Call the function to verify the connection
verifyConnection();

// Sample route to fetch data from Neo4j
app.get('/api', async (req, res) => {
  const session = driver.session();
  try {
    const result = await session.run('MATCH (n) RETURN n LIMIT 10');
    const records = result.records.map(record => record.get('n').properties);
    res.status(200).json(records);
  } catch (error) {
    console.error('Error fetching data from Neo4j:', error);
    res.status(500).send('Error fetching data');
  } finally {
    await session.close();
  }
});

// WITH date() AS today
//       MATCH (loc:Location)-[:HAS_WEATHER]->(weather:Weather)
//       WHERE date(datetime(weather.datetime)) >= today AND date(datetime(weather.datetime)) < today + duration({ days: 3 })
//       AND weather.cloudcover <= 80
//       AND (weather.visibility >= 10 OR weather.visibility IS NULL)
//       AND time(datetime(weather.datetime)) > time("00:00:00") 
//       AND time(datetime(weather.datetime)) < weather.sunrise
//       WITH loc, date(datetime(weather.datetime)) AS forecastDate, weather.sunrise AS sunrise, count(weather) AS favorableHours
//       WITH forecastDate, collect({location: loc.name, zipCode: loc.zipCode, sunrise: sunrise, favorableHours: favorableHours}) AS dailyOptions
//       UNWIND dailyOptions AS options
//       WITH forecastDate, options
//       ORDER BY options.favorableHours DESC
//       WITH forecastDate, collect(options)[0] AS bestOption
//       RETURN forecastDate, bestOption.location AS BestLocation, bestOption.zipCode AS ZipCode, bestOption.sunrise AS SunriseTime, bestOption.favorableHours AS MaxFavorableHours
//       ORDER BY forecastDate, MaxFavorableHours DESC

// Query 3
app.get('/api/place_to_travel', async (req, res) => {
  const session = driver.session();
  try {
    const result = await session.run(
      `WITH date() AS today
      MATCH (loc:Location)-[:HAS_WEATHER]->(weather:Weather)
      WHERE date(datetime(weather.datetime)) >= today AND date(datetime(weather.datetime)) < today + duration({ days: 3 })
      AND weather.cloudcover <= 100
      AND (weather.visibility >= 10 OR weather.visibility IS NULL)
      AND time(datetime(weather.datetime)) > time("00:00:00") 
      AND time(datetime(weather.datetime)) < weather.sunrise
      WITH loc, date(datetime(weather.datetime)) AS forecastDate, weather.sunrise AS sunrise, 
           collect(distinct datetime(weather.datetime)) AS uniqueWeatherTimes
      WITH loc, forecastDate, sunrise, size(uniqueWeatherTimes) AS favorableHours
      ORDER BY favorableHours DESC
      WITH forecastDate, collect({
          location: loc.name, 
          zipCode: loc.zipCode, 
          latitude: loc.latitude, 
          longitude: loc.longitude,
          sunrise: sunrise, 
          favorableHours: favorableHours
        }) AS dailyOptions
      UNWIND dailyOptions AS options
      WITH forecastDate, options
      ORDER BY options.favorableHours DESC
      WITH forecastDate, collect(options)[0] AS bestOption
      RETURN forecastDate, 
             bestOption.location AS BestLocation, 
             bestOption.zipCode AS ZipCode, 
             bestOption.latitude AS Latitude, 
             bestOption.longitude AS Longitude,
             bestOption.sunrise AS SunriseTime, 
             bestOption.favorableHours AS MaxFavorableHours
      ORDER BY forecastDate, MaxFavorableHours DESC
      `
    );
    // const records = result.records.map(record => ({
    //   forecastDate: record.get('forecastDate'),
    //   BestLocation: record.get('BestLocation'),
    //   SunriseTime: record.get('SunriseTime')
    // }));
    // res.json(records);
    const records = result.records.map(record => record.toObject());
    res.json(records);
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).send(error.message);
  } finally {
    await session.close();
  }
});

// Query 1
app.get('/api/weather/:zip', async (req, res) => {
  const { zip } = req.params;
  const session = driver.session();
  try {
    const result = await session.run(
      `WITH date() AS today, $zip AS desiredZipCode
      MATCH (loc:Location {zipCode: desiredZipCode})-[:HAS_WEATHER]->(weather:Weather)
      WHERE date(datetime(weather.datetime)) >= today AND date(datetime(weather.datetime)) < today + duration({ days: 7 })
      WITH loc.zipCode AS ZipCode, weather, date(datetime(weather.datetime)) AS forecastDate
      ORDER BY forecastDate
      // Aggregate average temperature, visibility, and cloud cover for each day
      WITH forecastDate, ZipCode,
           AVG(weather.temp) AS avgTemp,
           AVG(weather.visibility) AS avgVisibility,
           AVG(weather.cloudcover) AS avgCloudCover
      // Convert the numerical averages into categorical values based on the provided lookup tables
      WITH forecastDate, ZipCode, avgTemp, 
           CASE
             WHEN avgVisibility >= 20 THEN 'Excellent'
             WHEN avgVisibility >= 10 THEN 'Good'
             WHEN avgVisibility >= 4 THEN 'Moderate'
             WHEN avgVisibility >= 1 THEN 'Poor'
             ELSE 'Very Poor'
           END AS VisibilityCategory,
           CASE
             WHEN avgCloudCover <= 10 THEN 'Clear Skies'
             WHEN avgCloudCover <= 30 THEN 'Mostly Clear'
             WHEN avgCloudCover <= 70 THEN 'Partly Cloudy'
             WHEN avgCloudCover <= 90 THEN 'Mostly Cloudy'
             ELSE 'Overcast'
           END AS CloudCoverCategory
      // Determine the possibility of viewing based on the categorical values
      WITH forecastDate, ZipCode, avgTemp, VisibilityCategory, CloudCoverCategory,
           CASE 
             WHEN VisibilityCategory = 'Excellent' AND CloudCoverCategory IN ['Clear Skies', 'Mostly Clear'] THEN 'High'
             WHEN VisibilityCategory IN ['Good', 'Moderate'] AND CloudCoverCategory IN ['Partly Cloudy'] THEN 'Moderate'
             WHEN VisibilityCategory IN ['Poor', 'Very Poor'] OR CloudCoverCategory IN ['Mostly Cloudy', 'Overcast'] THEN 'Low'
             ELSE 'Very Low'
           END AS ViewingPossibility
      RETURN forecastDate, ZipCode, avgTemp AS AverageTemperature, VisibilityCategory, CloudCoverCategory, ViewingPossibility
      ORDER BY forecastDate`, {zip}
    );
    const records = result.records.map(record => record.toObject());
    res.json(records);
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).send(error.message);
  } finally {
    await session.close();
  }
});

// Query 2
app.get('/api/umbrella_advice/:zip', async (req, res) => {
  const { zip } = req.params;
  const session = driver.session();
  try {
    const result = await session.run(
      `// Set the zip code
      WITH '15026' AS givenZip, date() AS today
      // Match weather data related to the location with the given zip code
      MATCH (loc:Location {zipCode: givenZip})-[:HAS_WEATHER]->(weather:Weather)
      // Filter weather data for the next 7 days
      WHERE date(datetime(weather.datetime)) >= today AND date(datetime(weather.datetime)) < today + duration({ days: 7 })
      WITH weather, date(datetime(weather.datetime)) AS forecastDate,
           // Determine the time range based on the hour
           CASE
             WHEN time(datetime(weather.datetime)) >= time({hour: 7, minute: 0}) AND time(datetime(weather.datetime)) < time({hour: 12, minute: 0}) THEN 'Morning'
             WHEN time(datetime(weather.datetime)) >= time({hour: 12, minute: 0}) AND time(datetime(weather.datetime)) < time({hour: 17, minute: 0}) THEN 'Afternoon'
             WHEN time(datetime(weather.datetime)) >= time({hour: 17, minute: 0}) AND time(datetime(weather.datetime)) < time({hour: 22, minute: 0}) THEN 'Evening'
           END AS timeRange
      // Ensure we only proceed with rows that have a timeRange
      WHERE timeRange IS NOT NULL
      // Group by timeRange, forecastDate, and calculate average precipitation probability
      WITH forecastDate, timeRange, avg(weather.precipprob) AS avgPrecipProb
      // Return the time range, average precipitation probability, and umbrella advice
      RETURN forecastDate, timeRange, 
             avgPrecipProb,
             CASE 
               WHEN avgPrecipProb > 0.5 THEN 'Bring umbrella'
               ELSE 'No umbrella needed'
             END AS UmbrellaAdvice
      ORDER BY forecastDate, timeRange
      `, {zip}
    );
    const records = result.records.map(record => ({
      timeRange: record.get('timeRange'),
      avgPrecipProb: record.get('avgPrecipProb'),
      UmbrellaAdvice: record.get('UmbrellaAdvice')
    }));
    res.json(records);
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).send(error.message);
  } finally {
    await session.close();
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await driver.close();
  process.exit(0);
});