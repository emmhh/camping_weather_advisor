# Camping Advisor APP

The `Regional_data_combined` folder contains all data and scripts used to generate the data.
Code structure is for the ease of hosting the back-end and front-end on Glitch, for final demo purposes.

You will need to add your own .env with api keys.

`Node version: 20.10.0`

## Assumptions
- Camping locations tend to have low light pollution for meteor shower watching
- two locations are considered adjacent if they are within 30 30-minute drive away.
- Camping locations have the keywords "state park" or "camp" in their name on Google Maps.

## Data
fetched 15 days forecast from VisualCrossing Weather Data API and filtered out the locations based on keywords and distance (keywords contain "state park" or "camp", distance is within 3 hour's drive.

## Use case scenarios
You are a visitor to Pittsburgh, PA, you love camping and heard that there will be meteor showers to watch around Pittsburgh, and you would like to figure out the best location for the best meteor shower watching experience, along with some weather forecast advise.

## Future Improvements
- streamline the data loading with Airflow to update DB daily, so it's real-time data in the system. Or utilise AWS EventBridge to schedule data loading from a lambda function.
- Adapt data from the US instead of Pittsburgh, PA only. (VisualCrossing API incurs charges.)
