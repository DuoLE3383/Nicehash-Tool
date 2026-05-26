# Nicehash Dashboard - Features & Functions

A comprehensive React-based dashboard for managing Nicehash mining operations with complete REST API integration.

## 🎨 Features

### Dashboard Sections

#### 1. **Account** (`AccountSection.tsx`)
- View account information
- Display account ID, email, and wallet details
- Real-time refresh functionality

**Functions:**
- `getAccount()` - Fetch account details from API

#### 2. **Mining Rigs** (`RigsSection.tsx`)
- View all active mining rigs
- Monitor rig status (online/offline)
- Display real-time statistics:
  - Current hashrate/speed
  - GPU temperature
  - CPU temperature
  - GPU count
- Auto-load active workers

**Functions:**
- `getRigs()` - List all mining rigs
- `getActiveWorkers()` - Get active worker info
- `getRigDetails(rigId)` - Get specific rig details
- `getRigStatsByAlgo()` - Get rig stats by algorithm
- `getMinerStats()` - Get miner statistics

#### 3. **Pools** (`PoolsSection.tsx`)
- View all configured mining pools
- Create new pools with:
  - Algorithm selection
  - Pool hostname & port
  - Username and password
- **Verify pools** before using
- **Delete pools** from configuration

**Functions:**
- `getPools()` - List all pools
- `getPoolDetails(poolId)` - Get pool details
- `createPool(poolData)` - Create new pool
- `verifyPool(poolData)` - Verify pool configuration
- `deletePool(poolId)` - Delete pool

#### 4. **Tool Configuration** (`ToolConfigSection.tsx`)
- Configure automation tool settings:
  - Min/Max delay between actions (milliseconds)
  - CSS selectors for:
    - Pool dropdown
    - Pool item list
    - Verify button
    - Close button
- Save configuration to backend
- Load saved configuration

**Functions:**
- `getConfig()` - Load tool configuration
- `saveConfig(config)` - Save configuration to API

### Dashboard Navigation
- Multi-tab interface with:
  - 📊 Dashboard (overview)
  - 👤 Account (account info)
  - ⛏️ Mining Rigs (rig management)
  - 🏊 Pools (pool management)
  - ⚙️ Configuration (tool settings)

## 🔧 API Integration

Complete REST API wrapper in `src/api.ts` with 30+ endpoints:

### Account Endpoints
```javascript
nicehashAPI.getAccount()
nicehashAPI.getBalances()
nicehashAPI.getBalance(currency)
nicehashAPI.getActivities(currency)
nicehashAPI.getCurrencies()
```

### Mining Endpoints
```javascript
nicehashAPI.getRigs()
nicehashAPI.getActiveWorkers()
nicehashAPI.getRigDetails(rigId)
nicehashAPI.getRigStatsByAlgo()
nicehashAPI.getMinerStats()
nicehashAPI.getPayouts()
nicehashAPI.getDailyEarnings()
nicehashAPI.getEarningsHistory()
nicehashAPI.getMiningGroups()
nicehashAPI.getMiningAlgorithms()
```

### Pool Endpoints
```javascript
nicehashAPI.getPools()
nicehashAPI.getPoolDetails(poolId)
nicehashAPI.createPool(poolData)
nicehashAPI.verifyPool(poolData)
nicehashAPI.deletePool(poolId)
```

### Config Endpoints
```javascript
nicehashAPI.getConfig()
nicehashAPI.saveConfig(config)
```

## 🎯 Design Features

### Professional UI
- **Dark theme** with Nicehash yellow accents
- **Responsive design** - works on desktop and mobile
- **Smooth animations** - fade-in and slide-in effects
- **Status indicators** - online/offline status badges
- **Real-time updates** - refresh buttons on all sections

### Color Scheme
- Primary: `#fbbf24` (Nicehash Yellow)
- Background: `#0f172a` (Dark Blue)
- Accent: `#f59e0b` (Dark Yellow)
- Success: `#22c55e` (Green)
- Error: `#ef4444` (Red)

### Components
- **Cards** - Clean card-based layouts
- **Grids** - Responsive grid layouts
- **Forms** - Professional form inputs
- **Buttons** - Primary, secondary, and danger actions
- **Messages** - Success and error notifications
- **Status Badges** - Visual status indicators

## 🚀 Usage

### Start the Application

**Option 1: Run Both Services Together**
```bash
npm run dev:all
```

**Option 2: Run Separately**

Terminal 1 - Backend API:
```bash
npm run api
```

Terminal 2 - React Dashboard:
```bash
npm run dev
```

### Access the Dashboard
Open your browser and navigate to:
```
http://localhost:5173
```

## 📝 Configuration

### Environment Variables
Set `VITE_API_BASE_URL` in `.env` to change the API server:
```
VITE_API_BASE_URL=http://your-api-server:8080
```

Default: `http://localhost:8088`

## 📂 File Structure

```
src/
├── App.tsx                 # Main dashboard component
├── AccountSection.tsx      # Account information section
├── RigsSection.tsx         # Mining rigs section
├── PoolsSection.tsx        # Pools management section
├── ToolConfigSection.tsx   # Tool configuration section
├── api.ts                  # API client & functions
├── main.tsx                # React entry point
└── index.css               # Global styles

api-server.mjs             # Backend Express server
package.json               # Dependencies & scripts
vite.config.ts             # Vite configuration
tsconfig.json              # TypeScript configuration
```

## 🔐 Security Notes

- All Nicehash API requests are authenticated server-side
- API credentials are stored on the backend only
- No sensitive data is exposed to the frontend
- Configuration is stored in-memory (can be extended to database)

## 📚 API Documentation

See [API_ENDPOINTS.md](API_ENDPOINTS.md) for complete endpoint documentation and examples.

For official Nicehash API docs: https://www.nicehash.com/docs/rest

## 🛠️ Future Enhancements

Possible additions:
- Database persistence for configurations
- User authentication & authorization
- Real-time WebSocket updates
- Advanced charting for earnings
- Automated backup/restore
- Multiple user support
- Customizable dashboard widgets
