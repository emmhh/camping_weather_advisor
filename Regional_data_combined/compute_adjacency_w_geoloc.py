import googlemaps
import csv
import json
from itertools import combinations

apikey='Your_API_KEY'

travel_limit = 0.5 # hours
# Initialize Google Maps client with your API key
gmaps = googlemaps.Client(key=apikey)

# Read zip codes from CSV
zip_codes = []
with open('locations.csv', mode='r') as infile:
    reader = csv.DictReader(infile)
    for row in reader:
        zip_codes.append(row['Zip Code'])  # Assuming there's a 'Zip Code' column

# Function to calculate travel time between two zip codes with error handling
def calculate_travel_time(origin, destination, gmaps_client):
    matrix = gmaps_client.distance_matrix(origins=[origin], destinations=[destination], mode="driving")
    element = matrix['rows'][0]['elements'][0]
    
    # Check if the API found a route and 'duration' key is present
    if element['status'] == 'OK' and 'duration' in element:
        travel_time_seconds = element['duration']['value']
        return travel_time_seconds / 3600  # Convert seconds to hours
    else:
        # Print an error message or handle the error as appropriate
        print(f"Could not calculate travel time from {origin} to {destination}: {element.get('status', 'Unknown error')}")
        print(element)
        return None  # Indicate that the calculation was not successful

# Calculate adjacency based on 1-hour travel time with error checking
adjacency_relations = {zip_code: [] for zip_code in zip_codes}

for (zip_code1, zip_code2) in combinations(zip_codes, 2):
    travel_time = calculate_travel_time(zip_code1, zip_code2, gmaps)
    if travel_time is not None and travel_time <= travel_limit:  # Check for success and 1 hour or less
        print(f"zipcode {zip_code1} and {zip_code2} is connected.")
        adjacency_relations[zip_code1].append(zip_code2)
        adjacency_relations[zip_code2].append(zip_code1)  # Assuming adjacency is bidirectional

# Print the adjacency relations
for zip_code, adjacents in adjacency_relations.items():
    print(f"{zip_code} is adjacent to: {', '.join(adjacents)}")

# Save the adjacency relations to a JSON file
with open('adjacency_relations.json', 'w') as outfile:
    json.dump(adjacency_relations, outfile)

# Save the adjacency relations to a CSV file
with open('adjacency_relations.csv', 'w', newline='') as csvfile:
    fieldnames = ['Zip Code', 'Adjacent Zip Codes']
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

    writer.writeheader()
    for zip_code, adjacents in adjacency_relations.items():
        writer.writerow({'Zip Code': zip_code, 'Adjacent Zip Codes': ', '.join(adjacents)})