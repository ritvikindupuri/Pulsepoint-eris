# PulsePoint ERIS

**A professional-grade Emergency Response Information System for logging calls, dispatching teams, and managing incidents, leveraging the power of Google's Gemini API.**

---

![PulsePoint ERIS Screenshot](https://storage.googleapis.com/aai-web-samples/apps/eris-screenshot.png)

## 📖 Introduction

PulsePoint ERIS is a modern, web-based application designed to streamline the operations of emergency response teams. It provides a centralized, role-based platform for every level of an emergency response organization, with intelligent features powered by Google's Gemini API. Dispatchers can log incoming calls with AI-assisted priority suggestions and location intelligence. EMTs can handle their assignments and accelerate reporting with an AI Scribe. Supervisors can manage team rosters, schedules, and generate AI-powered handover summaries. COOs can analyze operational performance, and Administrators can audit system activity.

With its clean, role-based interface and real-time data updates, PulsePoint ERIS is built to perform under pressure, ensuring that critical information is always accurate, intelligent, and accessible.

## ✨ Core Features

PulsePoint ERIS provides a tailored experience for each role within an emergency response organization.

### For Dispatchers
- **AI-Assisted Call Logging:** A dedicated form to quickly capture critical information, with a Gemini-powered AI that automatically suggests a priority level based on the incident description.
- **AI-Powered Location Intelligence:** Using Gemini with Google Maps Grounding, dispatchers can verify an address, get a summary of potential access challenges for an ambulance, and see a list of nearby hospitals, all before dispatching a unit.
- **Live Status Map:** A dynamic map providing a real-time (simulated) view of all active incidents and team locations.
- **Interactive Call Queue:** View all pending incidents, automatically sorted by priority, with a clear visual distinction for Priority 1 calls.
- **Advanced Search & Filtering:** Instantly find pending calls by location, description, or priority level.
- **Efficient Dispatching:** Select a pending call and assign it to any available team with a single click.
- **End-of-Day Reporting with AI Analysis:** Generate an instant report summarizing the day's key metrics, and use Gemini to create a qualitative analysis of trends, anomalies, and potential operational improvements.

### For EMTs (Emergency Medical Technicians)
- **Focused Assignment View:** A clear, detailed card shows the current active assignment, including location, caller details, and incident description.
- **Interactive Status Updates:** Manage your response status with a logical workflow of action buttons: "On Scene," "Transporting," and "Complete Call."
- **Clock In / Out:** Easily manage your on-duty status for the day.
- **Interactive AI Scribe for PCRs:** After completing a call, fill out a comprehensive form and use the **AI Scribe** to instantly generate professional narratives from raw notes. The generated text can be copied to the main notes field for review and editing.
- **Offline Capability:** File Patient Care Records even without an internet connection. The system automatically saves them locally and syncs them once connectivity is restored, with clear status indicators.
- **Shift Summary Analytics:** An at-a-glance dashboard with a doughnut chart showing a breakdown of calls handled by priority during the current shift.

### For Supervisors
- **High-Level Operational Dashboard:** Key performance indicators (KPIs) are displayed in clear "stat cards," showing open incidents, PCRs filed, and personnel status.
- **Advanced Team Roster Management:** View, filter, and manage all teams. An intuitive modal allows for editing team names, grades, and member assignments, with visibility into each member's certifications.
- **Personnel Management:** A dedicated tab allows supervisors to manage their EMTs, including editing their certifications to keep records up-to-date.
- **Weekly Scheduling Tool:** A powerful scheduling interface to assign teams to day and night shifts for the entire week.
- **AI-Powered Shift Handover Reporting:** Generate an "Exception Report" that lists all currently open incidents, and use Gemini to create an **AI-generated summary** to highlight critical information for the incoming shift, with an option to regenerate the summary as needed.
- **Full Data Export:** Export the complete list of open incidents to a CSV file with a single click.

### For COOs (Chief Operating Officers)
- **Executive SLA Dashboard:** An analytics-focused dashboard for viewing Service Level Agreement (SLA) performance.
- **Key Performance Metrics:** Stat cards display critical metrics like Average Dispatch Time, Average On-Scene Time, Average Total Response Time, and overall SLA Compliance Percentage.
- **SLA Compliance Visualization:** A clear bar chart shows the percentage of responses that met or missed the target response time.

### For Administrators
- **System Audit Log:** A comprehensive, immutable log of all significant actions taken within the system.
- **Data Export:** Export the complete audit log to a CSV file for offline analysis and record-keeping.
- **System Backup:** A one-click function to trigger a manual system backup (simulated).

### System-Wide Features
- **Secure Authentication:** A complete login and sign-up system ensures only authorized personnel can access the system.
- **Role-Based Access Control (RBAC):** The interface and capabilities are automatically tailored to the logged-in user's role.
- **Responsive Design:** The layout is optimized for a seamless experience on desktops, tablets, and mobile devices.
- **Dark & Light Mode:** A theme toggle to reduce eye strain, especially crucial for dispatchers working in low-light environments.

## ✅ Product Backlog (Completed)

| Req | Story ID | User Story (short)                        | Prio | Pts | Status |
|:---:|:--------:|:------------------------------------------|:----:|:---:|:------:|
| 1   | 1.01     | Dispatcher: Log calls fast                | High | 3   | **Done**   |
|     | 1.02     | Dispatcher: Filter/search calls           | High | 3   | **Done**   |
|     | 1.03     | Dispatcher: Set priority on log           | High | 5   | **Done**   |
|     | 1.04     | Dispatcher: AI verify address & hospital  | High | 8   | **Done**   |
| 2   | 2.01     | Supervisor: View active calls & teams     | High | 8   | **Done**   |
|     | 2.02     | Supervisor: Filter teams by base/grade    | High | 5   | **Done**   |
| 3   | 3.01     | EMT: Shift Check-In/Out                   | High | 5   | **Done**   |
|     | 3.02     | EMT: Early/late check-in requires approval| Med  | 3   | **Done**   |
| 4   | 4.01     | Manager: Auto exception report each shift | Med  | 8   | **Done**   |
|     | 4.02     | Manager: AI trends for handover           | Med  | 5   | **Done**   |
| 5   | 5.01     | COO: SLA dashboard (response times)       | Med  | 8   | **Done**   |
|     | 5.02     | COO: Export SLA data                      | Low  | 3   | **Done**   |
| 6   | 6.01     | EMT: Patient care form (vitals/treatments)| Med  | 5   | **Done**   |
|     | 6.02     | EMT: AI Scribe narrative from notes       | High | 8   | **Done**   |
| 7   | 7.01     | Admin: Secure login + RBAC                | High | 8   | **Done**   |
|     | 7.02     | Admin: Dark/Light Mode                    | Low  | 2   | **Done**   |
| 8   | 8.01     | Manager: Weekly scheduling tool           | Med  | 5   | **Done**   |
|     | 8.02     | Manager: Edit team composition/certs      | Med  | 5   | **Done**   |
| 9   | 9.01     | Admin: Backups and audit logs             | Low  | 3   | **Done**   |
|     | 9.02     | Admin: Export audit logs CSV              | Low  | 3   | **Done**   |
| 10  | 10.01    | Dispatcher: End-of-day report             | Med  | 5   | **Done**   |
|     | 10.02    | Dispatcher: AI trend insights             | Med  | 5   | **Done**   |

## 💻 Technology Stack

PulsePoint ERIS is a modern frontend application built with industry-standard technologies.

- **React:** A powerful JavaScript library for building user interfaces.
- **TypeScript:** Adds static typing to JavaScript for improved code quality and maintainability.
- **Tailwind CSS:** A utility-first CSS framework for rapid, custom UI development.
- **Chart.js:** A flexible library for creating beautiful and informative data visualizations.
- **@google/genai (Gemini API):** Heavily integrated for a variety of intelligent features:
    - **`gemini-2.5-flash`:** Powers fast tasks like priority suggestions and AI-driven handover summaries.
    - **`gemini-2.5-flash` with Google Maps Grounding:** Provides location-based intelligence for dispatchers.
    - **`gemini-2.5-flash-lite`:** Enables extremely low-latency text generation for the EMT's AI Scribe feature.
    - **`gemini-2.5-pro`:** Used for more complex analytical tasks, like generating deep operational insights for the End of Day report.

## 🔮 Future Enhancements (Version 2+)

-   **Real-Time Backend:** Replace the local state simulation with a true backend service (e.g., Node.js with WebSockets) for real-time data synchronization across all clients.
-   **Mobile EMT Application:** Dedicated iOS/Android apps for even faster data entry and GPS integration in the field.
-   **Predictive Analytics:** Use historical data to forecast demand and optimize resource allocation.
-   **Billing & Hospital Integration:** Streamline the data pipeline for billing and patient handovers.