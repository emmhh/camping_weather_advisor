# data fetching
1. *neighbour_cities.py*: fetch camping and state park locations near Pitsburgh. Store into *camping.csv* (name of location, Zip Code, Latitude, Longitude, Google Map Link)
2. *fetch_forecast.py*: Fetch weather forecast using the VisualCrossing API to fetch data of each location stored in *camping.csv*. combine all data and save into one csv and one json file - *combined_forecasts.csv*, *combined_forecasts.json*.
3. *compute_adjacency_w_geoloc.py*: compute the adjacency relation of each zip code region based on travel distance. Two zip code region is considered to be connected if the travel time is within 1 hour. Adjacency relation is stored in *adjacency_relations.json* and *adjacency_relations.csv*

# Assumptions
assuming two location is connected if its wihthin 30 mins travel time.
