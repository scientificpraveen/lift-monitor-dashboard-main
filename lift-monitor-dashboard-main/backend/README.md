# Lift Monitor Backend

This is the backend API server for the Lift Monitor Dashboard application.

## Features

- REST API endpoints for lift data
- WebSocket support for real-time updates
- Simulated lift data with dynamic floor changes
- CORS enabled for frontend integration
- Health check endpoint

## API Endpoints

### GET /api/lifts
Returns lift data for all buildings.

### GET /api/buildings
Returns list of all buildings.

### GET /api/lifts/:building
Returns lift data for a specific building.

### GET /health
Health check endpoint.

## WebSocket

Connect to `ws://localhost:3001` for real-time lift data updates.

## Setup Instructions

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Or start the production server:
   ```bash
   npm start
   ```

The server will run on `http://localhost:3001`

## Data Format

The API returns lift data in the following format:

```json
{
  "PRESTIGE POLYGON": [
    {
      "ID": "P1",
      "Fl": "13",
      "Alarm": "1",
      "Door": "0"
    }
  ]
}
```

Where:
- `ID`: Lift identifier
- `Fl`: Current floor
- `Alarm`: "1" = alarm/service, "0" = normal
- `Door`: "1" = door open, "0" = door closed
