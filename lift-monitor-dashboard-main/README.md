# Lift Monitor Dashboard

A comprehensive real-time monitoring and management system for lift operations across multiple buildings with HT/LT panel logging capabilities.

## Features

- **Real-time Lift Monitoring**: Monitor lift status across multiple buildings in real-time
- **Visual Status Indicators**: View current floor, movement direction, door status, and alarm states
- **HT/LT Panel Logging**: Record and manage High Tension and Low Tension electrical panel readings
- **Data Export**: Export panel logs to Excel and PDF formats
- **Interactive Dashboard**: Switch between lift monitoring and panel log management views
- **Historical Data**: View and filter historical panel log data
- **Shift Management**: Track shift incharge details and maintenance records
- **Parking Slot Vacancy**: Real-time tracking of parking slots (Prestige Polygon only)
- **STP Automation**: Real-time visualization of Sewage Treatment Plant operations (Motors, Valves, Tanks)

## Tech Stack

### Frontend
- React 19
- Vite
- Tailwind CSS
- Axios
- React Icons
- XLSX (for Excel exports)
- Framer Motion (for animations)

### Backend
- Node.js with Express
- WebSocket (ws) for real-time updates
- PostgreSQL database
- Prisma ORM
- PDFKit for PDF generation
- Compression middleware

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **PostgreSQL**: v14 or higher

## Project Structure

```
lift-monitor-dashboard/
├── backend/                  # Backend server
│   ├── prisma/              # Database schema and migrations
│   │   ├── schema.prisma    # Prisma schema definition
│   │   └── migrations/      # Database migration files
│   ├── services/            # Business logic services
│   ├── server.js            # Express server entry point
│   ├── panelLogContext.js   # Panel log database operations
│   ├── exportService.js     # Export utilities
│   └── package.json         # Backend dependencies
├── src/                     # Frontend React application
│   ├── components/          # React components
│   ├── services/            # API services
│   ├── config/              # Configuration files
│   └── utils/               # Utility functions
├── public/                  # Static assets
└── package.json             # Frontend dependencies
```

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd lift-monitor-dashboard-main
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

## Database Setup

### 1. Configure Database Connection

Create or update the `.env` file in the `backend` directory:

```bash
cd backend
touch .env
```

Add your PostgreSQL database connection URL:

```env
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
```

**Example:**
```env
DATABASE_URL="postgresql://admin:password@localhost:5432/lift_monitor?sslmode=require"
```

### 2. Run Database Migrations

Prisma migrations will create all necessary tables in your database.

```bash
cd backend
npx prisma migrate deploy
```

This command applies all pending migrations to your database.

### 3. Generate Prisma Client

Generate the Prisma client to interact with your database:

```bash
npx prisma generate
```

### 4. (Optional) View Database in Prisma Studio

To visually inspect and manage your database:

```bash
npx prisma studio
```

This opens a browser-based database GUI at `http://localhost:5555`

## Database Migration Commands

### Create a New Migration

When you modify the Prisma schema:

```bash
cd backend
npx prisma migrate dev --name <migration-name>
```

Example:
```bash
npx prisma migrate dev --name add_user_table
```

### Reset Database

To reset the database and apply all migrations from scratch:

```bash
npx prisma migrate reset
```

⚠️ **Warning**: This will delete all data in your database!

### Check Migration Status

```bash
npx prisma migrate status
```

### Apply Migrations in Production

```bash
npx prisma migrate deploy
```

## Running the Application

### Development Mode

You need to run both frontend and backend servers simultaneously.

#### Option 1: Using Two Terminals

**Terminal 1 - Backend Server:**
```bash
cd backend
npm run dev
```
Backend will run on: `http://localhost:3001`

**Terminal 2 - Frontend Dev Server:**
```bash
npm run dev
```
Frontend will run on: `http://localhost:5000`

#### Option 2: Using a Process Manager

You can also use tools like `concurrently` or `pm2` to run both servers together.

### Production Mode

**Build Frontend:**
```bash
npm run build
```

**Run Backend:**
```bash
cd backend
npm start
```

The built frontend can be served using any static file server or integrated with the backend.

## Environment Variables

### Backend (.env)

```env
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
PORT=3001
```

### Frontend

Frontend uses hardcoded API endpoints. To change:
- Edit `src/services/api.js`
- Update `API_BASE_URL` constant

## API Endpoints

### Lift Monitoring

- `GET /api/lifts` - Get all lift data
- `GET /api/buildings` - Get list of buildings
- `GET /api/lifts/:building` - Get lifts for specific building
- `POST /api/lifts` - Update lift data
- `GET /health` - Health check endpoint

### Panel Logs

- `GET /api/panel-logs` - Get all panel logs (supports filtering)
- `GET /api/panel-logs/:id` - Get specific panel log
- `POST /api/panel-logs` - Create new panel log
- `PUT /api/panel-logs/:id` - Update panel log
- `DELETE /api/panel-logs/:id` - Delete panel log
- `DELETE /api/panel-logs` - Delete all panel logs

### Parking Vacancy (Prestige Polygon)

- `GET /api/parking-slots` - Get current parking status
- `POST /api/update-parking-slots/` - Update parking status

#### Update Payload Example (POST)
```json
{
  "P1": 1,
  "P2": 0,
  "P3": 1,
  "P4": 0
}
```
*(1 = Occupied, 0 = Vacant)*

### STP Automation

- `GET /api/stp` - Get real-time STP state (motors, valves, sensors)
- `POST /api/update-stp` - Update STP state (broadcasts to all clients)

**Example POST Payload:**
```json
{
  "M1": 1,          // Motor 1 ON
  "PSFValve": 0,     // Filter Mode (0-6 allowed)
  "InletPressure": 2.5 // Pressure Sensor
}
```

### Export

- `GET /api/panel-logs/export/excel` - Export to Excel
- `GET /api/panel-logs/export/pdf` - Export to PDF

## Query Parameters for Filtering

Panel logs can be filtered using the following query parameters:

- `building` - Filter by building name
- `date` - Filter by specific date (YYYY-MM-DD)
- `dateFrom` - Filter from date
- `dateTo` - Filter to date
- `panelType` - Filter by panel type (HT/LT/BOTH)
- `time` - Filter by time slot (HH:MM format)

**Example:**
```
GET /api/panel-logs?building=PRESTIGE+POLYGON&dateFrom=2025-11-01&dateTo=2025-11-30&panelType=HT
```

## Buildings Configuration

The system is configured to monitor the following buildings:

- PRESTIGE POLYGON
- PRESTIGE PALLADIUM
- PRESTIGE METROPOLITAN
- PRESTIGE COSMOPOLITAN
- PRESTIGE CYBER TOWERS

To add or modify buildings, edit `src/config/buildings.js`

## WebSocket Real-time Updates

The application uses WebSocket for real-time lift status updates:

- **WebSocket URL**: `ws://localhost:3001/ws`
- **Message Types**:
  - `liftData` - Full lift data update
  - `liftUpdate` - Partial lift status update
  - `stpUpdate` - Real-time STP automation state update

## Time Slots

Panel logs are recorded in 2-hour intervals:

- 00:00 - 02:00
- 02:00 - 04:00
- 04:00 - 06:00
- 06:00 - 08:00
- 08:00 - 10:00
- 10:00 - 12:00
- 12:00 - 14:00
- 14:00 - 16:00
- 16:00 - 18:00
- 18:00 - 20:00
- 20:00 - 22:00
- 22:00 - 24:00

## Database Schema

### PanelLog Table

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Auto-increment primary key |
| building | String | Building name |
| date | String | Log date (YYYY-MM-DD) |
| time | String | Time slot (HH:MM) |
| panelType | String | Panel type (HT/LT/BOTH) |
| htPanel | JSON | HT panel readings |
| ltPanel | JSON | LT panel readings |
| shiftIncharge | JSON | Shift incharge details |
| powerFailure | JSON | Power failure information |
| remarks | String | Additional remarks |
| engineerSignature | String | Engineer signature |
| createdAt | DateTime | Record creation timestamp |
| updatedAt | DateTime | Record update timestamp |

## Troubleshooting

### Database Connection Issues

**Problem**: Cannot connect to database

**Solution**:
1. Verify PostgreSQL is running
2. Check DATABASE_URL in `.env` file
3. Ensure database exists and credentials are correct
4. Check firewall settings

### Port Already in Use

**Problem**: Error: Port 3001 or 5000 already in use

**Solution**:
```bash
# Find and kill process using the port (macOS/Linux)
lsof -ti:3001 | xargs kill -9
lsof -ti:5000 | xargs kill -9

# Or change port in configuration files
```

### Prisma Migration Errors

**Problem**: Migration fails or schema is out of sync

**Solution**:
```bash
cd backend
npx prisma migrate reset
npx prisma generate
npx prisma migrate deploy
```

### WebSocket Connection Failed

**Problem**: Real-time updates not working

**Solution**:
1. Ensure backend server is running
2. Check browser console for WebSocket errors
3. Verify WebSocket URL in `src/services/api.js`
4. Check for proxy/firewall blocking WebSocket connections

## Development Tips

### Hot Reload

Both frontend and backend support hot reloading:
- Frontend: Vite HMR (automatic)
- Backend: Using nodemon (automatic)

### Database Seeding

The backend automatically initializes with sample data on first run. To customize, edit `backend/panelLogContext.js`.

### Debugging

Enable debug mode by setting environment variables:

```bash
DEBUG=* npm run dev
```

### Code Formatting

The project uses ESLint for code quality:

```bash
npm run lint
```

## Security Considerations

⚠️ **Important**: Before deploying to production:

1. Change the DATABASE_URL in `.env` to use a secure password
2. Add `.env` to `.gitignore` (already included)
3. Use environment-specific configuration
4. Enable HTTPS for production
5. Implement authentication and authorization
6. Use secure WebSocket connections (wss://)
7. Sanitize user inputs
8. Implement rate limiting




