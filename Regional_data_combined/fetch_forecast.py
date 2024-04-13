import csv
import requests
import json

# Read zip codes from the CSV file
zip_codes = []
with open('camping.csv', mode='r') as file:
    csv_reader = csv.DictReader(file)
    for row in csv_reader:
        zip_codes.append(row['Zip Code'])

# API Key and Base URL for the weather data
api_key = "8NUW9KD54S8BFYJT5L6PEBHA9"
base_url = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/"

# Filenames for the combined data
combined_csv_filename = "combined_forecasts2.csv"
combined_json_filename = "combined_forecasts2.json"
combined_json_data = []

# Dictionary to hold sunrise and sunset times for each zip code
sun_data = {}

# Fetch JSON data
for zip_code in zip_codes:
    json_url = f"{base_url}{zip_code}?unitGroup=metric&include=hours&key={api_key}&contentType=json"
    response_json = requests.get(json_url)
    
    if response_json.status_code == 200:
        data = response_json.json()
        combined_json_data.append(data)
        # Store sunrise and sunset times by date for each zip code
        sun_data[zip_code] = {day['datetime']: {'sunrise': day['sunrise'], 'sunset': day['sunset']} for day in data['days']}
    else:
        print(f"Failed to fetch JSON data for zip code {zip_code}: HTTP {response_json.status_code}")

# Write combined JSON data to a file
with open(combined_json_filename, 'w') as json_file:
    json.dump(combined_json_data, json_file)

# # Fetch and combine CSV data with sunrise and sunset times
# with open(combined_csv_filename, mode='w', newline='') as combined_csv_file:
#     csv_writer = None
#     for i, zip_code in enumerate(zip_codes):
#         csv_url = f"{base_url}{zip_code}?unitGroup=metric&include=days&key={api_key}&contentType=csv"
#         response_csv = requests.get(csv_url)
        
#         if response_csv.status_code == 200:
#             csv_lines = response_csv.text.split("\n")
#             reader = csv.DictReader(csv_lines)
#             if i == 0:  # Initialize the CSV writer with headers including sunrise and sunset
#                 fieldnames = reader.fieldnames + ['sunrise', 'sunset']
#                 csv_writer = csv.DictWriter(combined_csv_file, fieldnames=fieldnames)
#                 csv_writer.writeheader()
            
#             for row in reader:
#                 date = row['datetime'].split('T')[0]  # Extract date from datetime
#                 if date in sun_data[zip_code]:
#                     row.update(sun_data[zip_code][date])  # Add sunrise and sunset times
#                 csv_writer.writerow(row)
#         else:
#             print(f"Failed to fetch CSV data for zip code {zip_code}: HTTP {response_csv.status_code}")
# ... Previous code ...

# Fetch and combine CSV data with sunrise and sunset times
with open(combined_csv_filename, mode='w', newline='') as combined_csv_file:
    csv_writer = None
    for i, zip_code in enumerate(zip_codes):
        csv_url = f"{base_url}{zip_code}?unitGroup=metric&include=hours&key={api_key}&contentType=csv"
        response_csv = requests.get(csv_url)

        if response_csv.status_code == 200:
            csv_lines = response_csv.text.split("\n")
            reader = csv.DictReader(csv_lines)
            if i == 0:  # Initialize the CSV writer with headers including sunrise and sunset
                fieldnames = reader.fieldnames + ['sunrise', 'sunset']
                csv_writer = csv.DictWriter(combined_csv_file, fieldnames=fieldnames)
                csv_writer.writeheader()

            for row in reader:
                # Extract date and time from 'datetime', convert 'name' to zip code
                date = row['datetime'].split('T')[0]  # Extract date from datetime
                zipcode_from_name = row['name'].split(", ")[0]  # Assumes zip code is the first part of the 'name' field
                if date in sun_data[zipcode_from_name]:
                    # Update the row with sunrise and sunset times
                    row.update(sun_data[zipcode_from_name][date])
                else:
                    # If no sun data found for the date, put empty strings
                    row['sunrise'] = ''
                    row['sunset'] = ''
                csv_writer.writerow(row)
        else:
            print(f"Failed to fetch CSV data for zip code {zip_code}: HTTP {response_csv.status_code}")

print("Weather forecast data has been successfully combined into CSV and JSON files.")

# import csv
# import requests
# import json

# # Read zip codes from the CSV file
# zip_codes = []
# with open('camping.csv', mode='r') as file:
#     csv_reader = csv.DictReader(file)
#     for row in csv_reader:
#         zip_codes.append(row['Zip Code'])

# # API Key and Base URL for the weather data
# api_key = "Your_API_KEY"
# base_url = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/"

# # Filenames for the combined data
# combined_csv_filename = "combined_forecasts.csv"
# combined_json_filename = "combined_forecasts.json"
# combined_json_data = []

# # Fetch and combine CSV data
# with open(combined_csv_filename, mode='w') as combined_csv_file:
#     for i, zip_code in enumerate(zip_codes):
#         csv_url = f"{base_url}{zip_code}?unitGroup=metric&include=hours&key={api_key}&contentType=csv"
#         response_csv = requests.get(csv_url)
        
#         if response_csv.status_code == 200:
#             if i == 0:
#                 combined_csv_file.write(response_csv.text)
#             else:
#                 combined_csv_file.write("\n".join(response_csv.text.split("\n")[1:]))
#         else:
#             print(f"Failed to fetch CSV data for zip code {zip_code}: HTTP {response_csv.status_code}")

# # Fetch JSON data
# for zip_code in zip_codes:
#     json_url = f"{base_url}{zip_code}?unitGroup=metric&include=hours&key={api_key}&contentType=json"
#     response_json = requests.get(json_url)
    
#     if response_json.status_code == 200:
#         combined_json_data.append(response_json.json())
#     else:
#         print(f"Failed to fetch JSON data for zip code {zip_code}: HTTP {response_json.status_code}")

# # Write combined JSON data to a file
# with open(combined_json_filename, 'w') as json_file:
#     json.dump(combined_json_data, json_file)

# print("Weather forecast data has been successfully combined into CSV and JSON files.")
