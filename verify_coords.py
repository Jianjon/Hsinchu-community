
import json
import sys
from shapely.geometry import shape, Point

# Coordinates to check
# Format: (lng, lat) for Shapely (GeoJSON uses lng, lat)
# My code used [lat, lng], so I need to swap.
locations_to_check = {
    "Beilun_Centroid": (121.008293, 24.830274), # Injected in publicDataAdaptor.ts
    "Food_Bank": (121.0120, 24.8390)            # Injected in mock_public.ts
}

geojson_path = "/Users/jon/Desktop/社區發展/taiwan-village-analyst/public/data/public_hsinchu_villages.json"

try:
    with open(geojson_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    beilun_feature = None
    for feature in data['features']:
        # Check properties for name
        # Usually VILLNAME or VILLAGE_NAME
        props = feature.get('properties', {})
        name = props.get('VILLNAME') or props.get('VILLAGE_NAME') or props.get('Name')
        if name and '北崙里' in name:
            beilun_feature = feature
            break
            
    if not beilun_feature:
        print("❌ Error: Could not find '北崙里' in GeoJSON")
        sys.exit(1)
        
    polygon = shape(beilun_feature['geometry'])
    
    print(f"--- Checking {beilun_feature['properties'].get('VILLNAME', '北崙里')} Boundary ---")
    
    all_passed = True
    for label, (lng, lat) in locations_to_check.items():
        point = Point(lng, lat)
        is_inside = polygon.contains(point)
        mark = "✅" if is_inside else "❌"
        print(f"{mark} {label}: {is_inside}")
        if not is_inside:
            all_passed = False
            # Check distance if outside
            dist = polygon.distance(point)
            print(f"   Distance to boundary: {dist} degrees")
            
    if all_passed:
        print("\nAll coordinates are valid!")
    else:
        print("\nSome coordinates are outside the boundary.")

except Exception as e:
    print(f"Error: {e}")
