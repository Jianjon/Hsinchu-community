
import json
import sys

# Simple Point in Polygon (Ray Casting)
def is_point_in_polygon(point, polygon):
    # point: [lng, lat]
    # polygon: List of rings, usually polygon[0] is the outer ring
    # Ring: List of [lng, lat]
    
    x, y = point
    inside = False
    
    # Check outer ring only for simplicity (holes are rare in this context)
    ring = polygon[0]
    
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i]
        xj, yj = ring[j]
        
        intersect = ((yi > y) != (yj > y)) and \
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
        if intersect:
            inside = not inside
        j = i
        
    return inside

locations_to_check = {
    "Beilun_Centroid": [121.008293, 24.830274],
    "Food_Bank": [121.0120, 24.8390]
}

geojson_path = "/Users/jon/Desktop/社區發展/taiwan-village-analyst/public/data/public_hsinchu_villages.json"

try:
    with open(geojson_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    beilun_feature = None
    for feature in data['features']:
        props = feature.get('properties', {})
        name = props.get('VILLNAME') or props.get('VILLAGE_NAME') or props.get('Name')
        if name and '北崙里' in name and ('竹北市' in props.get('TOWNNAME', '') or '竹北市' in props.get('TOWN_NAME', '')):
            beilun_feature = feature
            break
            
    if not beilun_feature:
        print("❌ Error: Could not find '北崙里' in GeoJSON")
        # Try finding just by name
        for feature in data['features']:
             props = feature.get('properties', {})
             name = props.get('VILLNAME') or props.get('VILLAGE_NAME')
             if name and '北崙里' in name:
                 print(f"Found {name} in {props.get('TOWNNAME')} but strictly looking for Zhubei")
                 beilun_feature = feature
                 break
        if not beilun_feature:
             sys.exit(1)
             
    geometry = beilun_feature['geometry']
    coordinates = geometry['coordinates']
    
    # Handle MultiPolygon if needed, but usually Village is Polygon
    polygons = []
    if geometry['type'] == 'Polygon':
        polygons.append(coordinates)
    elif geometry['type'] == 'MultiPolygon':
        polygons = coordinates
        
    print(f"--- Checking {beilun_feature['properties'].get('VILLNAME', '北崙里')} Boundary ---")
    
    for label, point in locations_to_check.items():
        is_inside = False
        for poly in polygons:
            if is_point_in_polygon(point, poly):
                is_inside = True
                break
        
        mark = "✅" if is_inside else "❌"
        print(f"{mark} {label}: {is_inside} (Point: {point})")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
