// Load the data and relations first
LOAD CSV WITH HEADERS FROM 'file:///camping.csv' AS row
CREATE (:Location {
  name: row.Name,
  address: row.Address,
  zipCode: row.ZipCode,
  mapsUrl: row.GoogleMapsURL,
  latitude: toFloat(row.Latitude),
  longitude: toFloat(row.Longitude)
})
--------------------------------------------------------------------
LOAD CSV WITH HEADERS FROM 'file:///adjacency_relations.csv' AS row
WITH row.ZipCode AS zipCode, split(row.AdjacentZipCodes, ',') AS adjacentList
MATCH (origin:Location {zipCode: zipCode})
UNWIND adjacentList AS adjZipCode
WITH origin, trim(adjZipCode) AS adjZipCode
WHERE adjZipCode <> ''  // Filter out empty values if any
MATCH (adjacent:Location {zipCode: adjZipCode})
MERGE (origin)-[:ADJACENT_TO]->(adjacent)
--------------------------------------------------------------------
// forecast including the sunrise and sunset
LOAD CSV WITH HEADERS FROM 'file:///combined_forecasts.csv' AS row
WITH row, SPLIT(row.name, ",")[0] AS zip
MATCH (loc:Location {zipCode: zip})
CREATE (weather:Weather {
  datetime: row.datetime,
  temp: toFloat(row.temp),
  feelslike: toFloat(row.feelslike),
  dew: toFloat(row.dew),
  humidity: toFloat(row.humidity),
  precip: toFloat(row.precip),
  precipprob: toFloat(row.precipprob),
  preciptype: row.preciptype,
  snow: toFloat(row.snow),
  snowdepth: toFloat(row.snowdepth),
  windgust: toFloat(row.windgust),
  windspeed: toFloat(row.windspeed),
  winddir: toFloat(row.winddir),
  sealevelpressure: toFloat(row.sealevelpressure),
  cloudcover: toFloat(row.cloudcover),
  visibility: toFloat(row.visibility),
  solarradiation: toFloat(row.solarradiation),
  solarenergy: toFloat(row.solarenergy),
  uvindex: toInteger(row.uvindex),
  severerisk: toInteger(row.severerisk),
  conditions: row.conditions,
  icon: row.icon,
  stations: row.stations,
  sunrise: time(row.sunrise),
  sunset: time(row.sunset)
})
MERGE (loc)-[:HAS_WEATHER]->(weather)
--------------------------------------------------------------------

// Queries

// Q3 Query Tell me in the next 3 days, which location should i go to have the best meteor shower observation experience?
// new q3
WITH date() AS today
MATCH (loc:Location)-[:HAS_WEATHER]->(weather:Weather)
WHERE date(datetime(weather.datetime)) >= today AND date(datetime(weather.datetime)) < today + duration({ days: 3 })
AND weather.cloudcover <= 80
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
// old q3
WITH date() AS today
MATCH (loc:Location)-[:HAS_WEATHER]->(weather:Weather)
WHERE date(left(weather.datetime, 10)) >= today AND date(left(weather.datetime, 10)) < today + duration({ days: 3 })
AND weather.cloudcover <= 80
AND (weather.visibility >= 10 OR weather.visibility IS NULL)
AND time(weather.sunrise) > time("00:00:00") // After midnight
WITH loc, weather, date(left(weather.datetime, 10)) AS forecastDate
ORDER BY forecastDate, weather.cloudcover ASC, time(weather.sunrise) ASC
WITH forecastDate, collect({location: loc.name, sunrise: weather.sunrise})[0] AS bestOption
RETURN forecastDate, bestOption.location AS BestLocation, bestOption.sunrise AS SunriseTime
ORDER BY forecastDate
// Q3 output
╒════════════╤════════════════════════════════════════╤═══════════╕ 
│forecastDate│BestLocation                            │SunriseTime│ 
╞════════════╪════════════════════════════════════════╪═══════════╡ 
│"2024-04-02"│"Washington / Pittsburgh SW KOA Journey"│"07:02:20Z"│ 
├────────────┼────────────────────────────────────────┼───────────┤ 
│"2024-04-03"│"Fox Den Acres Campgrounds"             │"06:58:09Z"│ 
├────────────┼────────────────────────────────────────┼───────────┤ 
│"2024-04-04"│"Montour Trail Campground"              │"06:58:04Z"│ 
└────────────┴────────────────────────────────────────┴───────────┘ 
--------------------------------------------------------------------

// Q2: Set the zip code and current date
// new
// Set the zip code
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

// old
WITH '15026' AS givenZip, date() AS today
// Match weather data related to the location with the given zip code
MATCH (loc:Location {zipCode: givenZip})-[:HAS_WEATHER]->(weather:Weather)
// Filter weather data for today
WHERE date(datetime(weather.datetime)) = today
WITH weather,
     // Determine the time range based on the hour
     CASE
       WHEN time(datetime(weather.datetime)) >= time({hour: 7, minute: 0}) AND time(datetime(weather.datetime)) < time({hour: 12, minute: 0}) THEN 'Morning'
       WHEN time(datetime(weather.datetime)) >= time({hour: 12, minute: 0}) AND time(datetime(weather.datetime)) < time({hour: 17, minute: 0}) THEN 'Afternoon'
       WHEN time(datetime(weather.datetime)) >= time({hour: 17, minute: 0}) AND time(datetime(weather.datetime)) < time({hour: 22, minute: 0}) THEN 'Evening'
     END AS timeRange
// Ensure we only proceed with rows that have a timeRange
WHERE timeRange IS NOT NULL
// Group by timeRange and calculate average precipitation probability
WITH timeRange, avg(weather.precipprob) AS avgPrecipProb
// Return the time range, average precipitation probability, and umbrella advice
RETURN timeRange, 
       avgPrecipProb,
       CASE 
         WHEN avgPrecipProb > 0.5 THEN 'Bring umbrella'
         ELSE 'No umbrella needed'
       END AS UmbrellaAdvice
ORDER BY timeRange
// Q2 output 
╒═══════════╤══════════════════╤════════════════╕ 
│timeRange  │avgPrecipProb     │UmbrellaAdvice  │ 
╞═══════════╪══════════════════╪════════════════╡ 
│"Afternoon"│48.800000000000004│"Bring umbrella"│ 
├───────────┼──────────────────┼────────────────┤ 
│"Evening"  │59.2              │"Bring umbrella"│ 
├───────────┼──────────────────┼────────────────┤ 
│"Morning"  │80.0              │"Bring umbrella"│ 
└───────────┴──────────────────┴────────────────┘ 
--------------------------------------------------------------------

// Q1 let me know the liklihood that i will be able to see sunrise and sunset in the next 7 days from today for a specific location(zip code).
//new
WITH date() AS today, 15026 AS desiredZipCode
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
      ORDER BY forecastDate

// Set your desired zip code here
WITH date() AS today, "15026" AS desiredZipCode
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
ORDER BY forecastDate
// Q1 output
╒════════════╤═══════╤══════════════════╤══════════════════╤══════════════════╤══════════════════╕
│forecastDate│ZipCode│AverageTemperature│VisibilityCategory│CloudCoverCategory│ViewingPossibility│
╞════════════╪═══════╪══════════════════╪══════════════════╪══════════════════╪══════════════════╡
│"2024-04-02"│"15026"│14.691666666666665│"Moderate"        │"Mostly Cloudy"   │"Low"             │
├────────────┼───────┼──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│"2024-04-03"│"15026"│10.729166666666668│"Moderate"        │"Mostly Cloudy"   │"Low"             │
├────────────┼───────┼──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│"2024-04-04"│"15026"│4.504166666666667 │"Good"            │"Mostly Cloudy"   │"Low"             │
├────────────┼───────┼──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│"2024-04-05"│"15026"│3.4458333333333333│"Good"            │"Mostly Cloudy"   │"Low"             │
├────────────┼───────┼──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│"2024-04-06"│"15026"│4.429166666666665 │"Excellent"       │"Partly Cloudy"   │"Very Low"        │
├────────────┼───────┼──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│"2024-04-07"│"15026"│6.679166666666665 │"Excellent"       │"Partly Cloudy"   │"Very Low"        │
├────────────┼───────┼──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│"2024-04-08"│"15026"│9.404166666666661 │"Excellent"       │"Partly Cloudy"   │"Very Low"        │
└────────────┴───────┴──────────────────┴──────────────────┴──────────────────┴──────────────────┘