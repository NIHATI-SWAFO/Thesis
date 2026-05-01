# Heatmap Enhancement Plan (Thesis Improvements)

This document outlines the proposed high-impact improvements for the **Campus Violation Heatmap** to strengthen the spatial analysis portion of the CS thesis.

---

## 🚀 Proposed Enhancements

### 1. Temporal Decay Weighting (Algorithm Integration)
*   **Concept:** Integrate the existing **Temporal Decay Algorithm** ($e^{-0.023 \times days}$) directly into the map weighting.
*   **Implementation:** 
    *   Backend calculates a "Heat Intensity" for each violation point based on its age.
    *   Recent violations glow with high intensity (Red); older violations fade into cooler colors (Green/Transparent).
*   **Thesis Value:** Demonstrates the bridge between temporal and spatial algorithmic analysis.

### 2. Temporal Playback (Time Slider)
*   **Concept:** A draggable horizontal slider at the bottom of the map allowing users to view a "replay" of violations over time.
*   **Implementation:**
    *   User drags slider from Week 1 to Week 12.
    *   Map filters the GeoJSON data in real-time.
*   **Thesis Value:** Cinematic data visualization showing the evolution of "Red Zones" throughout a semester.

### 3. Building Risk Ranking Sidebar
*   **Concept:** A dedicated right-side panel that lists all buildings ranked by their violation density.
*   **Features:**
    *   **Risk Badges:** 🔴 Critical, 🟠 High, 🟡 Moderate, 🟢 Low.
    *   **Interactive Navigation:** Clicking a building name in the list automatically "flies" the camera to that building on the map.
*   **Thesis Value:** Transitions the heatmap from a passive visual to an actionable institutional intelligence tool.

### 4. 3D Volumetric Extrusions
*   **Concept:** Use Mapbox's `fill-extrusion` layer to make building footprints "rise up" based on violation counts.
*   **Implementation:** 
    *   Height of building $H = \text{violation\_count} \times \text{scale\_factor}$.
    *   Taller buildings visually represent higher institutional risk.
*   **Thesis Value:** High-fidelity 3D visualization that is impressive for live defense demonstrations.

### 5. Institutional College Filtering
*   **Concept:** Add a "Filter by College" dropdown to the map header.
*   **Implementation:** 
    *   Allows a Dean to see hotspots *only* for their specific college (e.g., "Where are CICS students violating rules the most?").
*   **Thesis Value:** Maintains consistency with the newly implemented privacy-first reporting module.

---

## 🛠 Technical Requirements
- **Mapbox API:** Utilize `heatmap-weight` property for Temporal Decay.
- **GeoJSON Source:** Backend `ViolationGeoJSONView` needs to include a computed `weight` property.
- **Frontend State:** React state for `activeWeek` (slider) and `selectedBuilding` (sidebar).
