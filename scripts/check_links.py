import requests
import json
import os

NOTION_KEY = os.environ.get("NOTION_API_KEY", "")
HEADERS = {
    "Authorization": f"Bearer {NOTION_KEY}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}
LANDLORDS_DB = "32b39a01-a595-802c-b37b-e4723f2e8994"

url = f"https://api.notion.com/v1/databases/{LANDLORDS_DB}/query"
resp = requests.post(url, headers=HEADERS, json={"page_size": 100})
if resp.status_code == 200:
    results = resp.json().get("results", [])
    db_ids = [r["id"] for r in results]
    print(f"Found {len(db_ids)} landlords in the database.")
    
    # Check if our test ID is in the DB
    test_id = "2f050791-a975-802b-8e15-eb87cab4c37e"
    if test_id in db_ids:
        print(f"Yes! The ID {test_id} from the spreadsheet is already in LIST OF LANDLORDS.")
    else:
        print(f"No. The ID {test_id} is NOT in LIST OF LANDLORDS.")
        # print out the first 3 IDs to see what they look like
        print("Sample IDs from DB:")
        for i in db_ids[:3]:
            print(i)
else:
    print(f"Error querying DB: {resp.status_code}")
