import csv
import urllib.request
import json
import os

url = "https://docs.google.com/spreadsheets/d/1PvURHGRwsQqdmC5pp0zlKHJE3QcfgpZJlP1zxD0iztY/export?format=csv&gid=0"
try:
    response = urllib.request.urlopen(url)
    lines = [l.decode('utf-8') for l in response.readlines()]
    reader = csv.DictReader(lines)
    data = list(reader)
    
    # Format as Markdown table
    if data:
        header = data[0].keys()
        md = "| " + " | ".join(header) + " |\n"
        md += "| " + " | ".join(["---"] * len(header)) + " |\n"
        for row in data:
            md += "| " + " | ".join([row[k] for k in header]) + " |\n"
            
        os.makedirs("Notion", exist_ok=True)
        with open("Notion/Majaz.md", "w", encoding="utf-8") as f:
            f.write("# Majaz Landlords Data\n\n")
            f.write(md)
            
        print("Successfully saved to Notion/Majaz.md")
        print("\nFirst row for context:")
        print(json.dumps(data[0], indent=2, ensure_ascii=False))
        
        # Save JSON too for easier processing next
        with open("Notion/Majaz_data.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
    else:
        print("No data found.")
except Exception as e:
    print(f"Error fetching: {e}")
