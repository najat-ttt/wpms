# Wedding Planning Management System

## Project Overview
A web-based dashboard application designed to streamline the wedding planning process. It provides users with a centralized, responsive platform to manage tasks, coordinate with vendors, and track overall progress securely.

## Problem Statement
Wedding planning inherently involves juggling multiple spreadsheets, disparate email threads, and loose notes. This fragmentation leads to overlooked deadlines, lost vendor contacts, budget miscalculations, and increased stress for the couple. A unified, specialized management system is needed to consolidate these moving parts into one reliable source of truth.

## Objectives
- Centralize wedding tasks, vendor contacts, and event details in one accessible application.
- Provide resilient real-time data persistence and secure user authentication.
- Deliver an intuitive, responsive, and fast user experience without unnecessary architectural complexity.

## MVP Features
- Secure user registration, login, and guarded routing.
- Interactive dashboard with real-time statistics (pending/completed tasks, upcoming deadlines, total vendor costs).
- Profile management for couple details, dates, and venues.
- Full CRUD capabilities for Task Management and Vendor Management.
- Advanced filtering and multi-field search for tasks and vendors.
- Local timezone-aware overdue task detection.

## Technology Stack
- HTML5
- CSS3 (Custom Variables, Flexbox, CSS Grid)
- JavaScript ES6+ (Native Modules)
- Firebase Authentication
- Firebase Firestore

## System Architecture
The application follows a lightweight client-side architecture utilizing vanilla web technologies, removing the overhead of heavy SPA frameworks. The frontend comprises plain HTML templates, modularized CSS files, and ES6 JavaScript modules that interact directly with the Firebase Web SDK. Firebase Authentication manages secure user sessions via email and password, while Firestore provides real-time, resilient NoSQL data storage. Strict Firestore Security Rules enforce data isolation boundaries, ensuring each authenticated user can solely read and write their respective documents.

## Project Structure
```text
/
├── index.html                 # Login Entry Point
├── register.html              # User Registration
├── dashboard.html             # Overview Dashboard
├── tasks.html                 # Task Management View
├── vendors.html               # Vendor Management View
├── wedding-profile.html       # Profile Details View
├── firestore.rules            # Database Security Rules
├── package.json               # Node.js dependencies
├── src/
│   ├── css/
│   │   ├── variables.css      # CSS custom properties
│   │   ├── global.css         # Reset and structural styles
│   │   └── components.css     # UI components (buttons, cards, forms)
│   └── js/
│       ├── auth.js            # Auth routing and session guards
│       ├── db.js              # Firestore queries and abstractions
│       ├── firebase-config.js # Firebase App initialization
│       ├── layout.js          # Shared UI behaviors (sidebar, nav)
│       └── pages/             # Page-specific controllers
│           ├── dashboard.js
│           ├── login.js
│           ├── register.js
│           ├── tasks.js
│           ├── vendors.js
│           └── wedding-profile.js
```

## Core Modules
- **Authentication**: Manages registration, login, and secure route protection, hiding private application pages from unauthenticated access.
- **Dashboard**: Aggregates high-level metrics showing completed tasks, pending items, total vendor spend, and urgently overdue deadlines.
- **Wedding Profile**: Stores basic contextual data like the couple's names, event date, venue, and a brief description.
- **Task Management**: The core workflow engine for organizing the planning process.
- **Vendor Management**: A specialized rolodex and budgeting tool for hired or prospective event professionals.

## Task Management
The Task Management module allows users to Create, Read, Update, and Delete individual planning tasks. Each task tracks a Title, Description, Deadline, and Priority (Low, Medium, High). Tasks transition through structured statuses: To Do, In Progress, and Completed. The view includes text-based search indexing (scanning both titles and descriptions) and dropdown status filters, alongside automated overdue detection utilizing the local user's timezone.

## Vendor Management
The Vendor Management module provides CRUD functionality to maintain a roster of event professionals. Vendors are tracked with their Name, Category (Venue, Catering, Photography, Music, Florist, Other), Phone, Email, Service description, and Estimated Cost. This ensures all contacts and budget estimations remain easily filterable and centrally located.

## Database Structure
The application uses a scalable NoSQL hierarchy built on Firebase Firestore:
- `users/{userId}`: The root document for a registered user account.
- `users/{userId}/wedding/profile`: A sub-document storing the couple's global wedding details.
- `users/{userId}/tasks/{taskId}`: A sub-collection housing individual task records owned by the user.
- `users/{userId}/vendors/{vendorId}`: A sub-collection housing vendor contact and contract records.

## Kanban Development Process
The project utilizes the Kanban software process model to manage workflow efficiently, ensuring continuous delivery and preventing bottlenecks. The lifecycle visualizes work across the board:

Backlog
↓
To Do
↓
In Progress
↓
Code Review
↓
Testing
↓
Done

## Team Collaboration
The development process relies on disciplined Git workflows to ensure high-quality integrations:
- **feature branches**: Every new feature or bug fix is developed on an isolated branch.
- **meaningful commits**: Atomic, descriptive commits tracking the incremental evolution of the application.
- **Pull Requests**: Code is merged via PRs to track discussions, decisions, and architectural shifts.
- **code review**: Peer review enforces code quality, structural integrity, and security standards before merging.
- **merge to main**: Once approved, tested, and audited, code joins the main deployment branch.

## Installation
1. Clone the repository to your local machine.
2. Ensure you have [Node.js](https://nodejs.org/) installed.
3. Open a terminal in the project root directory.
4. Run `npm install` to install local development dependencies (e.g., Vite, Firebase SDK).

## Firebase Configuration
1. Create a project in the Firebase Console.
2. Enable Authentication (Email/Password) and a Firestore Database.
3. Your configuration uses `firebase-applet-config.json` managed by the environment, avoiding raw API keys in public JS.
4. Ensure you do not hardcode your API keys into tracked frontend code; inject them via environment configurations.
5. Deploy `firestore.rules` via the Firebase CLI to securely lock the database.

## Running the Project
To launch the local Vite development server:
```bash
npm run dev
```

To compile a production build:
```bash
npm run build
```

## Future Improvements
- Guest Management
- RSVP
- Budget
- Expense Tracking
- Wedding Schedule
- Notifications
- Advanced Analytics
