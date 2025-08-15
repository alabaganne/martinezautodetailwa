
# Car Wash Appointment Booking System

A modern, responsive web application for Martinez Auto Detail that allows customers to book car detailing appointments online. Built with React, Vite, and Tailwind CSS.

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

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS v4** - Utility-first CSS framework
- **Lucide React** - Icon library

## Project Structure

```
src/
├── components/
│   ├── booking/
│   │   ├── BookingSystem.jsx       # Main booking component
│   │   └── steps/
│   │       ├── ServiceSelection.jsx # Step 1: Service & vehicle type
│   │       ├── ScheduleSelection.jsx # Step 2: Date & time
│   │       ├── VehicleInfo.jsx      # Step 3: Customer & vehicle details
│   │       ├── ReviewConfirm.jsx    # Step 4: Review booking
│   │       └── Confirmation.jsx     # Step 5: Booking confirmation
│   └── common/
│       └── ProgressBar.jsx          # Progress indicator
├── data/
│   └── constants.js                 # Services, prices, durations
├── utils/
│   └── booking.js                   # Helper functions
└── App.jsx                          # Root component
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
http://localhost:5173
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Pricing Structure

### Base Prices
- **Interior Only**: $120
- **Exterior Only**: $100
- **Full Detail**: $200

### Vehicle Multipliers
- **Small Car**: 1.0x
- **Truck**: 1.2x
- **Minivan**: 1.3x

### Additional Charges
- **Very Dirty Condition**: +$50

## Business Hours

- **Open**: Monday - Friday
- **Drop-off Times**: 8:00 AM or 9:00 AM (same day) or evening before
- **Pickup Time**: 5:00 PM

## License

All rights reserved - Martinez Auto Detail
