# RouteWise — School Bus Management

A small MERN hackathon demo for managing students, buses, drivers, and routes.

## Requirements

- Node.js and npm
- MongoDB running locally, or a MongoDB Atlas connection string

## Run on Windows PowerShell

1. Open PowerShell in this project folder.
2. Install the dependencies:

   ```powershell
   npm run install:all
   ```

3. Create the server environment file:

   ```powershell
   Copy-Item server/.env.example server/.env
   ```

   The example uses a local MongoDB database at `mongodb://127.0.0.1:27017/school_bus_management`. If using Atlas, replace `MONGO_URI` in `server/.env` with your connection string.

4. Make sure MongoDB is running, then start both the API and website:

   ```powershell
   npm run dev
   ```

5. Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

The backend API runs at `http://localhost:5000`. The Vite development server forwards `/api` requests to it.

## What works

- Dashboard counts and route overview
- Create, list, edit, delete, and search students, buses, drivers, and routes
- MongoDB persistence through Mongoose
- Responsive layout for laptop and mobile screens

Use fictional records for demonstrations. This starter is a hackathon prototype; it does not include production authentication or role-based access yet.
