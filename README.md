# Nicehash Tool

This workspace now includes a new React + Vite dashboard for configuring the Nicehash tool via API.

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the React app:
   ```bash
   npm run dev
   ```
3. Open the local URL shown in the terminal.

## API connection

The dashboard sends requests to the Nicehash config API at:

- `http://localhost:8080/main/api/v2/config`

If your API runs somewhere else, set `VITE_API_BASE_URL` in `.env`.

## Notes

- The app expects a GET endpoint to fetch config and a POST endpoint to save config.
- Save the settings in the dashboard, then verify your Nicehash bot or userscript uses the updated config.
