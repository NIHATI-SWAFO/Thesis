# constants/locations.py
# Auto-generated from Overpass Turbo GeoJSON export
# Source: OSM Relation 8505494 — De La Salle University Dasmariñas
# Generated: April 2026
# Total locations: 52 patrol-relevant named locations
# DO NOT EDIT COORDINATES MANUALLY
# To update: re-run scripts/parse_locations.py with new export.geojson

DLSUD_LOCATIONS = {

    # ── GATES & ENTRY POINTS ──────────────────────────────────────────
    "Gate 3":                               {"lat": 14.3281023, "lng": 120.9569612},
    "Magdalo Gate":                         {"lat": 14.3216701, "lng": 120.9633916},

    # ── ACADEMIC BUILDINGS ────────────────────────────────────────────
    "CTH Building A":                       {"lat": 14.3234062, "lng": 120.9592155},
    "CTH Building B":                       {"lat": 14.3232843, "lng": 120.9594965},
    "Doctor Fe Del Mundo Hall":             {"lat": 14.3202359, "lng": 120.9628733},
    "Doña Marcela Agoncillo Hall":          {"lat": 14.3211602, "lng": 120.9622084},
    "Felipe Calderon Hall":                 {"lat": 14.3226234, "lng": 120.9596990},
    "Francisco Barzaga Hall":               {"lat": 14.3222260, "lng": 120.9598766},
    "Gregoria De Jesus Hall":               {"lat": 14.3237095, "lng": 120.9582591},
    "ICTC Building":                        {"lat": 14.3223323, "lng": 120.9629743},
    "Julian Felipe Hall":                   {"lat": 14.3211370, "lng": 120.9628567},
    "Ladislao Diwa Hall":                   {"lat": 14.3223048, "lng": 120.9596321},
    "LDH Kubo":                             {"lat": 14.3224933, "lng": 120.9596815},
    "Maria Salome Llanera Hall":            {"lat": 14.3227719, "lng": 120.9584732},
    "Mariano Alvarez Hall":                 {"lat": 14.3219241, "lng": 120.9629693},
    "Mariano Trias Hall":                   {"lat": 14.3237533, "lng": 120.9587990},
    "MTH Covered Court":                    {"lat": 14.3232939, "lng": 120.9589006},
    "Paulo Campos Hall":                    {"lat": 14.3209194, "lng": 120.9628865},
    "Saint La Salle Hall":                  {"lat": 14.3256939, "lng": 120.9590734},
    "Santiago Alvarez Hall":                {"lat": 14.3232948, "lng": 120.9582303},
    "Severino de las Alas Hall":            {"lat": 14.3226348, "lng": 120.9610677},
    "Vito Belarmino Hall":                  {"lat": 14.3222303, "lng": 120.9591472},

    # ── HIGH SCHOOL BUILDINGS ─────────────────────────────────────────
    "DLSU-D High School":                   {"lat": 14.3255855, "lng": 120.9585768},
    "De La Salle University - Dasmariñas High School Complex": {"lat": 14.3257582, "lng": 120.9590448},
    "High School Annex Building":           {"lat": 14.3255627, "lng": 120.9591360},
    "High School Chapel":                   {"lat": 14.3260533, "lng": 120.9592000},

    # ── FACILITIES & LANDMARKS ────────────────────────────────────────
    "Basic Education Covered Court":        {"lat": 14.3252593, "lng": 120.9590583},
    "Botanical Garden Park":                {"lat": 14.3216709, "lng": 120.9615933},
    "DLSU-D Grandstand":                    {"lat": 14.3249513, "lng": 120.9575162},
    "GMH Quadrangle":                       {"lat": 14.3228834, "lng": 120.9591659},
    "Guest House":                          {"lat": 14.3208670, "lng": 120.9596082},
    "Ladies Dormitory Complex":             {"lat": 14.3207950, "lng": 120.9592808},
    "Motor Pool":                           {"lat": 14.3202606, "lng": 120.9636220},
    "Residencia La Salle":                  {"lat": 14.3204049, "lng": 120.9620443},
    "Ugnayang La Salle":                    {"lat": 14.3267127, "lng": 120.9574525},
    "University Student Government":        {"lat": 14.3228244, "lng": 120.9590088},

    # ── LIBRARY & CULTURAL ────────────────────────────────────────────
    "Aklatang Emilio Aguinaldo":            {"lat": 14.3207434, "lng": 120.9619580},
    "Ayuntamiento":                         {"lat": 14.3207567, "lng": 120.9630615},
    "Ayuntamiento De Gonzalez":             {"lat": 14.3205439, "lng": 120.9630429},
    "Museo De La Salle":                    {"lat": 14.3209977, "lng": 120.9610387},
    "Rizal Library":                        {"lat": 14.3210924, "lng": 120.9618808},

    # ── CHAPEL & RELIGIOUS ────────────────────────────────────────────
    "Antonio and Victoria Cojuanco Memorial Chapel of Our Lady of the Holy Rosary": {
                                             "lat": 14.3205188, "lng": 120.9615292},
    "La Porteria De San Benildo":           {"lat": 14.3224365, "lng": 120.9633927},

    # ── HEALTH & SERVICES ─────────────────────────────────────────────
    "University Clinic":                    {"lat": 14.3211716, "lng": 120.9629366},

    # ── FOOD & CANTEEN AREA ───────────────────────────────────────────
    "Cafe Museo":                           {"lat": 14.3216672, "lng": 120.9600649},
    "Food Square Extension":                {"lat": 14.3215291, "lng": 120.9603484},
    "University Food Square":               {"lat": 14.3215061, "lng": 120.9599738},

    # ── PARKING ───────────────────────────────────────────────────────
    "DLSU-D Faculty/Staff Parking":         {"lat": 14.3244490, "lng": 120.9586005},
    "DLSU-D Student/Faculty/Staff Parking": {"lat": 14.3263091, "lng": 120.9578142},
    "High School Parking":                  {"lat": 14.3259515, "lng": 120.9585919},
}

# Campus center fallback — used when location name not found
CAMPUS_CENTER = {
    "lat": 14.3228,
    "lng": 120.9600
}


def get_coordinates(location_name: str) -> dict:
    """
    Returns lat/lng dict for a given location name.
    Falls back to campus center if location not found.

    Args:
        location_name: exact string matching a key in DLSUD_LOCATIONS

    Returns:
        dict with 'lat' and 'lng' keys
    """
    return DLSUD_LOCATIONS.get(location_name, CAMPUS_CENTER)


def get_all_location_names() -> list:
    """
    Returns sorted list of all location names.
    Use this to populate the violation recording dropdown.
    """
    return sorted(DLSUD_LOCATIONS.keys())


def get_locations_by_category() -> dict:
    """
    Returns locations grouped by category.
    Useful for organized dropdown with optgroups.
    """
    return {
        "Gates & Entry Points": [
            "Gate 3",
            "Magdalo Gate",
        ],
        "Academic Buildings": [
            "CTH Building A",
            "CTH Building B",
            "Doctor Fe Del Mundo Hall",
            "Doña Marcela Agoncillo Hall",
            "Felipe Calderon Hall",
            "Francisco Barzaga Hall",
            "Gregoria De Jesus Hall",
            "ICTC Building",
            "Julian Felipe Hall",
            "Ladislao Diwa Hall",
            "LDH Kubo",
            "Maria Salome Llanera Hall",
            "Mariano Alvarez Hall",
            "Mariano Trias Hall",
            "MTH Covered Court",
            "Paulo Campos Hall",
            "Santiago Alvarez Hall",
            "Severino de las Alas Hall",
            "Vito Belarmino Hall",
        ],
        "High School Area": [
            "Basic Education Covered Court",
            "DLSU-D High School",
            "De La Salle University - Dasmariñas High School Complex",
            "High School Annex Building",
            "High School Chapel",
        ],
        "Facilities & Landmarks": [
            "Botanical Garden Park",
            "DLSU-D Grandstand",
            "GMH Quadrangle",
            "Guest House",
            "Ladies Dormitory Complex",
            "Motor Pool",
            "Residencia La Salle",
            "Ugnayang La Salle",
            "University Student Government",
        ],
        "Library & Cultural": [
            "Aklatang Emilio Aguinaldo",
            "Ayuntamiento",
            "Ayuntamiento De Gonzalez",
            "Museo De La Salle",
            "Rizal Library",
        ],
        "Chapel & Religious": [
            "Antonio and Victoria Cojuanco Memorial Chapel of Our Lady of the Holy Rosary",
            "La Porteria De San Benildo",
        ],
        "Health & Services": [
            "University Clinic",
        ],
        "Food & Canteen Area": [
            "Cafe Museo",
            "Food Square Extension",
            "University Food Square",
        ],
        "Parking": [
            "DLSU-D Faculty/Staff Parking",
            "DLSU-D Student/Faculty/Staff Parking",
            "High School Parking",
        ],
    }
