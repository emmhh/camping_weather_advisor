import csv
#  convert adjacency_relations.csv from adjacent list to adjacent pair of nodes.
input_filename = 'adjacency_relations.csv'  # Update this to the path of your CSV file
output_filename = 'adjacency_pairs.csv'  # Update this to the desired output file path

# Function to process rows and remove self loops
def process_rows(reader):
    for row in reader:
        zipcode = row['ZipCode']
        adjacent_zipcodes = row['AdjacentZipCodes'].split(',')
        # Filter out self-loops and empty strings, then strip whitespace
        filtered_zipcodes = [adj_zip.strip() for adj_zip in adjacent_zipcodes if adj_zip.strip() and adj_zip.strip() != zipcode]
        # Create pairs
        for adj_zip in filtered_zipcodes:
            yield (zipcode, adj_zip)

# Read the input CSV and write to the output CSV
with open(input_filename, mode='r', newline='') as infile, \
     open(output_filename, mode='w', newline='') as outfile:
    
    # Create the CSV reader and writer
    reader = csv.DictReader(infile)
    writer = csv.writer(outfile)
    
    # Write the header for the output CSV
    writer.writerow(['ZipCode', 'AdjacentZipCode'])
    
    # Process each row and write to the output CSV
    writer.writerows(process_rows(reader))

print(f"Conversion complete. The new CSV is located at {output_filename}")
