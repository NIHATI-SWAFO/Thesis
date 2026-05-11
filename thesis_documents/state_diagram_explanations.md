# Formal State Diagram Explanations

**Figure 3.X.1: State Diagram of Module 1 (Dress Code Detection Pipeline)**

Figure 3.X.1 illustrates the real-time lifecycle of the AI-based dress code detection system at the institutional gates. The system operates in a continuous loop, beginning in an **IDLE (Live Feed Active)** state to monitor foot traffic. When a student enters the frame, the system transitions to the **Frame Captured** state to extract an image. This image enters **Preprocessing** and is resized to 640x640 pixels for the YOLO11s model.

Next, the system enters **Mode Determination** to apply the correct dress code policy. It transitions to **UNIFORM_MODE** for first-to-third-year students on regular days (Monday, Tuesday, Thursday, Friday) or to **CIVILIAN_MODE** for fourth-year students and designated wash days (Wednesday, Saturday). The system then enters **Garment Detection**, where the YOLO11s model identifies clothing items across 14 classes in approximately 7.3 milliseconds.

The detection results pass to **Compliance Evaluation**, where a rule engine checks the garments against the DLSU-D Student Handbook. Compliant attire triggers the **COMPLIANT** state, allowing the student to pass while the system returns to **IDLE**. If violations are found, the system enters **NON_COMPLIANT** and alerts the gate officer. To ensure human oversight, the system transitions to **Officer Intervention** for physical verification. The officer then moves to **Recording Violation** by scanning the student's identification. Finally, the system enters **Transmitting to Module 2**, forwarding the data and AI evidence to the web application via a REST API before returning to **IDLE**.

---

**Figure 3.X.2: State Diagram of Module 2 (Patrol Session Lifecycle)**

Figure 3.X.2 models the lifecycle of a SWAFO officer's patrol session within the web application. The process begins in the **Selecting Area** state, where the officer chooses a target zone using a violation density heatmap. The system then transitions to **Reviewing AI Route**, presenting a priority-ranked route calculated using the Haversine distance between the officer and campus buildings.

Upon confirming the route, the system enters the composite **IN_PROGRESS** state, which contains three concurrent sub-states. The first is **Live GPS Tracking**, which polls geolocation data to render a breadcrumb trail on a Mapbox interface. If the system detects the officer within a 30-meter radius of a building, it automatically triggers the **Checkpoint Secured** sub-state to log the arrival. The officer can also manually enter the **Photo Captured** sub-state to record evidence. These photos receive a forensic watermark containing GPS coordinates, location names, and timestamps before the system returns to tracking.

The patrol concludes through one of two terminal states. Aborting the patrol triggers the **CANCELLED** state, which discards temporary session data. Alternatively, finishing the route transitions the system to **COMPLETED**. This final state aggregates the session duration, total distance traveled, checkpoints logged, and photo evidence, archiving the data via the REST API for administrative analytics.
