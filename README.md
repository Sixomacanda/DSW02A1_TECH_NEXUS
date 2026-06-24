# Urban Track

Smart Community Issue Reporting Platform

## Project Overview

UrbanTrack is a web-based platform designed to help communities report, track, and manage local issues such as potholes, broken streetlights, water leaks, and other public hazards. The system centralizes issue reporting and improves communication between citizens and administrators.

---

## Problem Statement

In many communities, there is no structured way to report public issues. Reports are often scattered across phone calls, emails, and social media, leading to:

* Lost or duplicated reports
* Lack of accountability
* Poor communication
* No visibility on issue progress

UrbanTrack solves this by providing a centralized, transparent, and user-friendly reporting system.

---

## Key Features

### User Features

* User registration and login
* Submit and manage issue reports
* View reports on an interactive map
* Upvote issues to indicate priority
* Receive status updates on submitted reports

### Admin Features

* Admin dashboard for managing reports
* Update report status (Submitted, In Progress, Resolved)
* View reports by priority, category, or date
* Add comments and manage issue resolution

---

## System Functionality

### Issue Reporting

Users can submit reports with:

* Title and description
* Category (Roads, Water, Electricity, etc.)
* Location (via map)
* Optional image upload

### Map Integration

All issues are displayed on an interactive map, allowing users to:

* View nearby issues
* Filter by category and status
* Interact with reports visually

### Notifications

Users receive updates when:

* Their issue status changes
* Admins take action on reports

---

## API Integrations

UrbanTrack integrates several third-party APIs to enhance functionality:

* **Google Maps API**
  Provides geolocation, map display, and issue tracking by location

* **Language Translation API**
  Enables multilingual support for diverse users

* **Chatbot API**
  Provides real-time assistance and user guidance

* **Google OAuth 2.0**
  Enables secure login using Google accounts

* **YouTube Integration**
  Embedded tutorial videos explaining:

  * User registration
  * Issue submission process

---

## System Architecture (Overview)

### Core Entities

* User
* Admin
* Report
* Location
* Category
* Notification
* Status

### Relationships

* Users submit reports
* Reports are linked to locations and categories
* Admins manage and update reports
* Notifications are sent to users

---

## Technologies Used

* Frontend: HTML, CSS, JavaScript
* Backend: Node.js, Express
* Database: Firebase
* Version Control: GitHub

---

## Installation and Setup

1. Clone the repository:

```bash
git clone https://github.com/Sixomacanda/DSW02A1_TECH_NEXUS
```

2. Navigate into the project:

```bash
cd DSW02A1_TECH_NEXUS
```

3. Install dependencies:

```bash
npm install
```

4. Create a `.env` file:

```env
PORT=3000
GOOGLE_CLIENT_ID=###
GOOGLE_CLIENT_SECRET=###
MAP_API_KEY=###
CHATBOT_API_KEY=###
LANGUAGE_API_KEY=###
```

5. Run the application:

```bash
node server.js
```

6. Open in browser:

```
http://localhost:3000
```
7. Alternatively, use the link below (Recommended)
   ```
   https://urbantrack-9z2l.onrender.com/
   ```



## Security

* Google OAuth 2.0 authentication
* Secure password handling and session management
* API keys stored in environment variables
* HTTPS encryption for data transmission
* Input validation to prevent common attacks

---

## Deployment

* Hosted on Render
* Continuous deployment via GitHub integration
* Scalable architecture for growing usage


## Testing and Debugging

* Unit testing for individual components
* Integration testing for APIs
* Manual testing for user workflows
* User Acceptance Testing (UAT)
* Debugging using console logs and browser developer tools
* Version control with GitHub

## Project Structure

UrbanTrack/
│── public/
│── routes/
│── controllers/
│── models/
│── server.js
│── .env
│── package.json


---

## User Flow

### User

Login → Dashboard → Report Issue → Submit → View on Map → Track Status

### Admin

Login → Dashboard → View Reports → Update Status → Notify User


## Team Members

* SP MACANDA – Project Manager and Full-Stack Developer
* NB MHLANZI – Backend Developer
* M NDONYELA – Database Administrator
* Z MTHIYANE – Full-Stack Developer
* NA NGCOBO – Frontend Developer
* A SILINGA – Business Analyst

---

## Prototype

Figma Design:
https://www.figma.com/make/VkLQOG73LCIWFUpJ33Nw05/High-Fidelity-Web-Prototype

---

## Future Improvements

* Mobile application version
* Real-time notifications
* Advanced analytics dashboard


## License
This project is developed for academic purposes at the University of Johannesburg.
