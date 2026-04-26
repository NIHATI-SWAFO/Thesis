# DLSU-D Location Coordinate Setup Guide
> Feature: Violation Heatmap + Location-Based Recording
> Map Library: Mapbox GL JS (react-map-gl)
> Last Updated: April 2026
> Status: locations.py already generated ✅

---

## Current Status

| Step | Task | Status |
|---|---|---|
| 1 | Run Overpass Turbo query | ✅ Done |
| 2 | Export GeoJSON | ✅ Done |
| 3 | Parse GeoJSON → locations.py | ✅ Done — file provided |
| 4 | Place locations.py in Django project | ⬜ Todo |
| 5 | Update Violation model | ⬜ Todo |
| 6 | Update serializer to auto-populate coordinates | ⬜ Todo |
| 7 | Create heatmap API endpoint | ⬜ Todo |
| 8 | Update violation form dropdown | ⬜ Todo |
| 9 | Build Mapbox heatmap component | ⬜ Todo |

---

## What Was Extracted

From the Overpass Turbo export, **52 patrol-relevant locations** were identified
and grouped into 8 categories:

- Gates & Entry Points (2)
- Academic Buildings (19)
- High School Area (5)
- Facilities & Landmarks (9)
- Library & Cultural (5)
- Chapel & Religious (2)
- Health & Services (1)
- Food & Canteen Area (3)
- Parking (3)

Food stalls (Dream Cafe, Shawarma Bayrut, etc.) and non-patrol-relevant
nodes were excluded from the lookup table intentionally.

---

## Step 1 — Place locations.py in Your Django Project

Copy the provided `locations.py` file into your project:

```
backend/
└── constants/
    ├── __init__.py    ← create this if it doesn't exist
    └── locations.py   ← paste the generated file here
```

Create `__init__.py` if it doesn't exist:
```bash
touch backend/constants/__init__.py
```

---

## Step 2 — Update Django Violation Model

Add `latitude` and `longitude` fields to store coordinates
automatically when a violation is recorded.

```python
# models.py
from django.db import models

class Violation(models.Model):

    class Status(models.TextChoices):
        OPEN              = 'OPEN',              'Open'
        AWAITING_DECISION = 'AWAITING_DECISION', 'Awaiting Decision'
        DECISION_RENDERED = 'DECISION_RENDERED', 'Decision Rendered'
        DISMISSED         = 'DISMISSED',         'Dismissed'
        CLOSED            = 'CLOSED',            'Closed'

    student        = models.ForeignKey('Student', on_delete=models.CASCADE)
    officer        = models.ForeignKey('User',    on_delete=models.CASCADE)
    violation_code = models.CharField(max_length=20)
    description    = models.TextField(blank=True)
    status         = models.CharField(
                        max_length=30,
                        choices=Status.choices,
                        default=Status.OPEN
                     )

    # Location fields — auto-populated from lookup table
    location_name  = models.CharField(max_length=150)
    latitude       = models.FloatField(null=True, blank=True)
    longitude      = models.FloatField(null=True, blank=True)

    timestamp      = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
```

Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

---

## Step 3 — Auto-Populate Coordinates on Violation Save

Update your serializer to look up coordinates automatically
when the officer submits a violation. The officer only selects
the location name — the system handles the coordinates silently.

```python
# serializers.py
from rest_framework import serializers
from .models import Violation
from .constants.locations import get_coordinates

class ViolationSerializer(serializers.ModelSerializer):

    class Meta:
        model  = Violation
        fields = '__all__'
        read_only_fields = ['latitude', 'longitude', 'officer', 'timestamp']

    def create(self, validated_data):
        # Auto-lookup coordinates from location name
        location_name = validated_data.get('location_name', '')
        coords        = get_coordinates(location_name)

        validated_data['latitude']  = coords['lat']
        validated_data['longitude'] = coords['lng']
        validated_data['officer']   = self.context['request'].user

        return super().create(validated_data)
```

---

## Step 4 — Heatmap API Endpoint

```python
# views.py
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from collections import defaultdict
from .models import Violation
from .constants.locations import get_all_location_names, get_locations_by_category

@require_GET
def get_heatmap_data(request):
    """
    Returns violation data formatted for Mapbox heatmap layer.

    Query params (all optional):
        date_from  — YYYY-MM-DD
        date_to    — YYYY-MM-DD
        category   — minor / major / traffic

    Returns:
        heatmap_points   — GeoJSON FeatureCollection for Mapbox Source
        location_summary — list of {name, lat, lng, count} for markers
        total_violations — int
    """
    violations = Violation.objects.exclude(
        latitude=None
    ).exclude(
        longitude=None
    )

    # Apply filters
    date_from = request.GET.get('date_from')
    date_to   = request.GET.get('date_to')
    category  = request.GET.get('category')

    if date_from:
        violations = violations.filter(timestamp__date__gte=date_from)
    if date_to:
        violations = violations.filter(timestamp__date__lte=date_to)
    if category:
        violations = violations.filter(category=category)

    # Group by location and count
    location_counts = defaultdict(lambda: {
        'lat': 0, 'lng': 0, 'count': 0, 'name': ''
    })

    for v in violations:
        key = v.location_name
        location_counts[key]['lat']    = v.latitude
        location_counts[key]['lng']    = v.longitude
        location_counts[key]['count'] += 1
        location_counts[key]['name']   = v.location_name

    # ⚠️ Mapbox requires GeoJSON FeatureCollection format
    # ⚠️ Mapbox coordinate order is [lng, lat] — NOT [lat, lng]
    geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "count": loc['count'],
                    "name":  loc['name']
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [loc['lng'], loc['lat']]  # [lng, lat] for Mapbox
                }
            }
            for loc in location_counts.values()
            if loc['count'] > 0
        ]
    }

    # Summary for popup markers
    location_summary = [
        {
            'name':  loc['name'],
            'lat':   loc['lat'],
            'lng':   loc['lng'],
            'count': loc['count']
        }
        for loc in location_counts.values()
    ]

    return JsonResponse({
        'geojson':          geojson,
        'location_summary': location_summary,
        'total_violations': violations.count()
    })


@require_GET
def get_locations(request):
    """
    Returns all location names for the violation form dropdown.
    Supports flat list or grouped by category.
    """
    grouped = request.GET.get('grouped', 'false').lower() == 'true'

    if grouped:
        return JsonResponse({
            'locations': get_locations_by_category()
        })

    return JsonResponse({
        'locations': get_all_location_names()
    })
```

Register in urls.py:
```python
from .views import get_heatmap_data, get_locations

urlpatterns = [
    path('api/heatmap/',   get_heatmap_data, name='heatmap'),
    path('api/locations/', get_locations,    name='locations'),
]
```

---

## Step 5 — Update Violation Form Dropdown (React)

Replace your hardcoded dropdown with one that pulls from
the API endpoint — this ensures dropdown options always
match the coordinate lookup table exactly.

```jsx
// hooks/useLocations.js
import { useState, useEffect } from 'react'
import axios from 'axios'

export const useLocations = (grouped = false) => {
  const [locations, setLocations] = useState(grouped ? {} : [])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    axios.get(`/api/locations/?grouped=${grouped}`)
      .then(res => setLocations(res.data.locations))
      .finally(() => setLoading(false))
  }, [grouped])

  return { locations, loading }
}
```

```jsx
// ViolationForm.jsx — dropdown with category groups
import { useLocations } from '../hooks/useLocations'

const ViolationForm = () => {
  const { locations, loading } = useLocations(true) // grouped=true

  return (
    <select name="location_name">
      <option value="">Select location...</option>

      {Object.entries(locations).map(([category, names]) => (
        <optgroup key={category} label={category}>
          {names.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}
```

This renders the dropdown grouped by category:
```
── Gates & Entry Points ──
  Gate 3
  Magdalo Gate
── Academic Buildings ──
  CTH Building A
  CTH Building B
  ...
```

---

## Step 6 — Mapbox Heatmap Component

```jsx
// components/map/HeatmapLayer.jsx
import { Source, Layer } from 'react-map-gl'

const heatmapLayerStyle = {
  id:   'violations-heatmap',
  type: 'heatmap',
  paint: {
    // Weight each point by violation count
    'heatmap-weight': [
      'interpolate', ['linear'],
      ['get', 'count'],
      0,  0,
      1,  0.2,
      5,  0.6,
      10, 1.0
    ],
    // Increase intensity with zoom
    'heatmap-intensity': [
      'interpolate', ['linear'],
      ['zoom'],
      15, 1,
      19, 3
    ],
    // Color ramp — green to red
    'heatmap-color': [
      'interpolate', ['linear'],
      ['heatmap-density'],
      0,   'rgba(0, 0, 0, 0)',
      0.2, '#00c851',   // green  — low
      0.4, '#ffbb33',   // yellow — moderate
      0.6, '#ff8800',   // orange — high
      0.8, '#ff4444',   // red    — very high
      1.0, '#CC0000'    // dark red — critical
    ],
    // Radius grows with zoom
    'heatmap-radius': [
      'interpolate', ['linear'],
      ['zoom'],
      15, 20,
      17, 35,
      19, 50
    ],
    'heatmap-opacity': 0.85
  }
}

const HeatmapLayer = ({ geojson }) => {
  if (!geojson || geojson.features.length === 0) return null

  return (
    <Source id="violations-source" type="geojson" data={geojson}>
      <Layer {...heatmapLayerStyle} />
    </Source>
  )
}

export default HeatmapLayer
```

```jsx
// components/map/ViolationMarkers.jsx
// Shows popup markers on each location with violation count
import { Marker, Popup } from 'react-map-gl'
import { useState } from 'react'

const ViolationMarkers = ({ locationSummary }) => {
  const [selected, setSelected] = useState(null)

  return (
    <>
      {locationSummary.map((loc, i) => (
        <Marker
          key={i}
          latitude={loc.lat}
          longitude={loc.lng}
          onClick={() => setSelected(loc)}
        >
          <div style={{
            background:   '#ff4444',
            color:        'white',
            borderRadius: '50%',
            width:        24,
            height:       24,
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
            fontSize:     11,
            fontWeight:   700,
            cursor:       'pointer',
            border:       '2px solid white',
            boxShadow:    '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            {loc.count}
          </div>
        </Marker>
      ))}

      {selected && (
        <Popup
          latitude={selected.lat}
          longitude={selected.lng}
          onClose={() => setSelected(null)}
          closeButton={true}
          anchor="bottom"
        >
          <div style={{ padding: '4px 8px', minWidth: 160 }}>
            <strong style={{ fontSize: 13 }}>{selected.name}</strong>
            <br />
            <span style={{ color: '#ef4444', fontSize: 12 }}>
              {selected.count} violation{selected.count !== 1 ? 's' : ''} recorded
            </span>
          </div>
        </Popup>
      )}
    </>
  )
}

export default ViolationMarkers
```

```jsx
// pages/admin/MapAnalytics.jsx — full map page
import { useState, useEffect } from 'react'
import Map  from 'react-map-gl'
import HeatmapLayer    from '../../components/map/HeatmapLayer'
import ViolationMarkers from '../../components/map/ViolationMarkers'
import axios from 'axios'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN  = import.meta.env.VITE_MAPBOX_TOKEN
const DLSUD_CENTER  = { latitude: 14.3228, longitude: 120.9600, zoom: 17 }

const MapAnalytics = () => {
  const [geojson,         setGeojson]         = useState(null)
  const [locationSummary, setLocationSummary] = useState([])
  const [filters,         setFilters]         = useState({
    date_from: '',
    date_to:   '',
    category:  ''
  })

  const fetchHeatmap = () => {
    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '')
      )
    )
    axios.get(`/api/heatmap/?${params}`).then(res => {
      setGeojson(res.data.geojson)
      setLocationSummary(res.data.location_summary)
    })
  }

  useEffect(() => { fetchHeatmap() }, [filters])

  return (
    <div>
      {/* Filter controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          type="date"
          value={filters.date_from}
          onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))}
          placeholder="From"
        />
        <input
          type="date"
          value={filters.date_to}
          onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))}
          placeholder="To"
        />
        <select
          value={filters.category}
          onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
        >
          <option value="">All Categories</option>
          <option value="minor">Minor</option>
          <option value="major">Major</option>
          <option value="traffic">Traffic</option>
        </select>
      </div>

      {/* Map */}
      <Map
        initialViewState={DLSUD_CENTER}
        style={{ width: '100%', height: '600px', borderRadius: 12 }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        {/* Heatmap layer */}
        {geojson && <HeatmapLayer geojson={geojson} />}

        {/* Location markers with popups */}
        <ViolationMarkers locationSummary={locationSummary} />
      </Map>
    </div>
  )
}

export default MapAnalytics
```

---

## Debug Checklist — If Heatmap Not Appearing

```
□ 1. Is mapbox-gl CSS imported?
     import 'mapbox-gl/dist/mapbox-gl.css'
     Missing this = blank map

□ 2. Is coordinate order correct?
     Mapbox = [lng, lat] inside coordinates array
     NOT [lat, lng]
     Check: geojson.features[0].geometry.coordinates
     Should be: [120.96x, 14.32x]
     NOT:       [14.32x, 120.96x]

□ 3. Is geojson a valid FeatureCollection?
     console.log(geojson)
     Must have type: "FeatureCollection" and features array

□ 4. Are features array non-empty?
     console.log(geojson.features.length)
     If 0 → no violations in DB with coordinates

□ 5. Do violations in DB have lat/lng?
     Check Django admin → Violations table
     If latitude/longitude are null →
     serializer not auto-populating on save

□ 6. Is heatmap-weight properly scaled?
     If all violations have count=1 and max weight=10,
     all points render at very low intensity (barely visible)
     Lower the weight scale or increase heatmap-opacity

□ 7. Is MAPBOX_TOKEN correct?
     Must start with pk.
     Check .env: VITE_MAPBOX_TOKEN=pk.eyJ1...

□ 8. Is map container height set?
     style={{ height: '600px' }}
     Without explicit height = blank map
```

---

## Final File Structure

```
backend/
├── constants/
│   ├── __init__.py
│   └── locations.py          ✅ generated — 52 locations
├── models.py                 ⬜ add latitude/longitude fields
├── serializers.py            ⬜ auto-populate coordinates on save
├── views.py                  ⬜ add heatmap + locations endpoints
└── urls.py                   ⬜ register new routes

frontend/src/
├── hooks/
│   └── useLocations.js       ⬜ fetch locations from API
├── components/map/
│   ├── HeatmapLayer.jsx      ⬜ Mapbox Source + Layer
│   └── ViolationMarkers.jsx  ⬜ markers with popups
└── pages/admin/
    └── MapAnalytics.jsx      ⬜ full map page with filters
```

---

## Summary — What's Left To Do

```
1. Copy locations.py → backend/constants/locations.py
2. Update Violation model → add lat/lng fields
3. Run makemigrations + migrate
4. Update serializer → auto-populate coordinates
5. Add heatmap + locations API endpoints
6. Register endpoints in urls.py
7. Update violation form dropdown to use API
8. Build HeatmapLayer.jsx component
9. Build ViolationMarkers.jsx component
10. Build MapAnalytics.jsx page
```

---

*End of DLSU-D Location Coordinate Setup Guide*
*Map Library: Mapbox GL JS via react-map-gl*
