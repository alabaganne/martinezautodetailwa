
# Car Wash Appointment Booking System

A modern, responsive web application for Martinez Auto Detail that allows customers to book car detailing appointments online. Built with Next.js, React, and Tailwind CSS.

## Features

- **Multi-step Booking Form**: Intuitive 4-step process for booking appointments
- **Service Selection**: Choose between Interior Only, Exterior Only, or Full Detail services
- **Dynamic Pricing**: Real-time price calculation based on:
  - Service type
  - Vehicle size (Small Car, Truck, Minivan)
  - Vehicle condition (Normal or Very Dirty)
- **Flexible Scheduling**: 
  - Date picker with weekday-only selection
  - Same-day or evening-before drop-off options
  - Fixed 5:00 PM pickup time
- **Vehicle Information**: Capture customer and vehicle details
- **Booking Review**: Comprehensive summary before confirmation
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Next.js 15** - Full-stack React framework
- **React 19** - UI library
- **Tailwind CSS v4** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Square API** - Payment processing and appointment scheduling

## Project Structure

```
app/
├── api/
│   └── square/                      # Square API proxy endpoints
│       └── [...path]/
│           └── route.js
├── globals.css                      # Global styles
├── layout.jsx                       # Root layout
└── page.jsx                         # Home page

components/
├── booking/
│   ├── BookingSystem.jsx            # Main booking component
│   └── steps/
│       ├── ServiceSelection.jsx     # Step 1: Service & vehicle type
│       ├── ScheduleSelection.jsx    # Step 2: Date & time
│       ├── VehicleInfo.jsx          # Step 3: Customer & vehicle details
│       ├── ReviewConfirm.jsx        # Step 4: Review booking
│       └── Confirmation.jsx         # Step 5: Booking confirmation
├── common/
│   └── ProgressBar.jsx              # Progress indicator
└── SquareApiTest.jsx                # Square API testing component

lib/
├── config/
│   ├── env.js                       # Environment configuration
│   └── square.js                    # Square SDK configuration
├── data/
│   └── constants.js                 # Services, prices, durations
└── utils/
    ├── booking.js                   # Booking helper functions
    └── squareClient.js              # Square API client utilities
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone git@github.com:alabaganne/car-wash-appointments.git
cd car-wash-appointments
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint