import requests
import json
import os

NOTION_KEY = os.environ.get("NOTION_API_KEY", "")
HEADERS = {
    "Authorization": f"Bearer {NOTION_KEY}",
    "Notion-Version": "2022-06-28"
}

# Test with the first link: https://www.notion.so/2f050791a975802b8e15eb87cab4c37e
# Format ID with dashes
page_id_raw = "2f050791a975802b8e15eb87cab4c37e"
page_id = f"{page_id_raw[:8]}-{page_id_raw[8:12]}-{page_id_raw[12:16]}-{page_id_raw[16:20]}-{page_id_raw[20:]}"

print(f"Querying page: {page_id}")
url = f"https://api.notion.com/v1/pages/{page_id}"
resp = requests.get(url, headers=HEADERS)

if resp.status_code == 200:
    data = resp.json()
    print("SUCCESS! Page Properties:")
    props = data.get("properties", {})
    for k, v in props.items():
        print(f"- {k}: {v['type']}")
    
    # Save full sample for inspection
    with open("Notion/sample_page.json", "w") as f:
        json.dump(data, f, indent=2)
else:
    print(f"FAILED: {resp.status_code}")
    print(resp.text)
