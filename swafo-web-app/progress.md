# SWAFO Academic Portal Development Progress

## Completed
- **Student Dashboard Typography & Scaling**: Enforced a global `90%` font scale root for a professional, high-density layout. Refined dashboard text tracking and structure to match target aesthetic.
- **Profile, Dashboard, and Violation Pages**: Standardized padding, borders, and visual hierarchy. Decreased shadow spread and removed off-white tints from interactive elements.
- **Campus Handbook UI**: Successfully built the accordion interface. Fixed critical background blending issues by enforcing pure white (`bg-white`) cells for opened policies, leaving strict mint green boundaries (`border-l` and `border-t-4` accents).
- **Settings (System Configuration) UI**: Engineered a 1:1 match of the target mockup. Complete with custom toggle switches, active notification/device status pills, and the watermark shield (`verified_user` style) embedded within the Deep Green verification card.
- **Chatbot (AI Curator) Layout & Logic**: Rewrote `ChatBot.jsx` from scratch into a 2-column flexible layout meeting strict UX demands. Restored front-end state management so suggested pills directly map questions to the chat window, auto-scrolling automatically processes.

## In Progress
- **Transitioning from Mock Data to Live Endpoints**: Currently, properties like user names, handbook searches, and device history remain hard-coded React state strings.
- **Full SSO State Management Hookup**: Finalizing Microsoft MSAL to correctly ingest actual student accounts into the React Context globally.

## Pending
- **Backend API Integration**: Interfacing the finalized frontend UI with robust Springboot/NodeJS endpoints (fetching actual violation tickets instead of hardcoded data).
- **Backend Data Parsing for Chatbot**: Linking the frontend chat container to an actual conversational backend or RAG service handling genuine university PDF data.
- **User Settings Mutation**: Saving `ToggleNotifications` and `Device Revocations` logic to update the database.

## Key Context
- **Aesthetic Priorities Overrides**: We deviated from standard tailwind utility "greys/whites" strictly based on user constraint to ensure zero instances of components blending into the `#f2fcf8` application background. Cell fidelity is strictly `bg-white` and elevated borders.
- **Approach**: Our workflow fundamentally relies on dissecting specific .jpg target files, iterating React structures directly around grid layouts, fine-tuning visual constraints iteratively through Github version control pushes.
