# fetch the camping locations and state parks within 3 hours drive from current location(Pittsburgh)
# store the location info into locations.csv, we will use zip code to further fetch the forecast data.

import googlemaps
from datetime import datetime
import csv

apikey='Your_API_KEY'
# Setup your Google Maps API key
gmaps = googlemaps.Client(key=apikey)

# Pittsburgh's coordinates
pittsburgh_coords = '40.4406,-79.9959'

# Use the Places API to find campgrounds and state parks around Pittsburgh
# Note: Adjust radius or use pagination for comprehensive search
places_result = gmaps.places_nearby(location=pittsburgh_coords,
                                    radius=100000,  # Search within a large radius
                                    type=['campground', 'park'])  # 'park' might need refining

def get_place_details(place_id, gmaps_client):
    """
    Fetch place details using the Place Details request.
    Returns a dictionary with name, address, maps URL, zip code, latitude, and longitude.
    """
    details = gmaps_client.place(place_id=place_id)
    result = details['result']
    
    place_details = {
        'name': result['name'],
        'address': result.get('formatted_address', 'Address not provided'),
        'maps_url': f"https://www.google.com/maps/place/?q=place_id:{place_id}",
        'zip_code': 'Zip code not provided',
        'latitude': result['geometry']['location']['lat'],
        'longitude': result['geometry']['location']['lng']
    }
    
    # Attempt to extract the zip code from the address components
    if 'address_components' in result:
        for component in result['address_components']:
            if 'postal_code' in component['types']:
                place_details['zip_code'] = component['long_name']
                break
    
    return place_details


# Enhanced function to filter places by driving time and include zip codes
def filter_by_drive_time_with_zip(places, origin, gmaps_client):
    filtered_places = []
    for place in places['results']:
        # Calculate drive time from Pittsburgh to the place
        destination_coords = f"{place['geometry']['location']['lat']},{place['geometry']['location']['lng']}"
        matrix = gmaps_client.distance_matrix(origins=[origin],
                                              destinations=[destination_coords],
                                              mode="driving")
        drive_time_seconds = matrix['rows'][0]['elements'][0]['duration']['value']
        if drive_time_seconds <= 10800:  # 3 hours in seconds
            # Fetch place details, including the zip code
            place_details = get_place_details(place['place_id'], gmaps_client)
            filtered_places.append(place_details)
    
    return filtered_places

# Assume `gmaps` is your Google Maps client initialized with your API key
details_of_places_within_3_hours = filter_by_drive_time_with_zip(places_result, pittsburgh_coords, gmaps)

# Print the filtered places with details
print("Campgrounds and state parks within a 3-hour drive from Pittsburgh with details:")
for place in details_of_places_within_3_hours:
    print(f"Name: {place['name']}")
    print(f"Address: {place['address']}")
    print(f"Zip Code: {place['zip_code']}")
    print(f"Google Maps URL: {place['maps_url']}\n")

# Assuming `details_of_places_within_3_hours` contains the locations' details
filename = "camping.csv"

with open(filename, mode='w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(["Name", "Address", "Zip Code", "Google Maps URL", "Latitude", "Longitude"])
    for place in details_of_places_within_3_hours:
        writer.writerow([place['name'], place['address'], place['zip_code'], place['maps_url'], place['latitude'], place['longitude']])
