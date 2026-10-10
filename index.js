import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const app = express();
app.use(cors());
app.use(express.json());

const definitions = {
  students: { name: String, grade: String, guardian: String, route: String },
  buses: { busNumber: String, registration: String, capacity: Number, status: String },
  drivers: { name: String, phone: String, license: String },
  routes: { name: String, busNumber: String, driver: String, stops: String, pickupTime: String }
};
const models = Object.fromEntries(Object.entries(definitions).map(([key, fields]) => [
  key, mongoose.models[key] || mongoose.model(key, new mongoose.Schema(fields, { timestamps: true }))
]));

app.get("/api/health", (_req, res) => res.json({ status: "ok", app: "School Bus Management" }));
app.get("/api/:type", async (req, res, next) => {
  try {
    const Model = models[req.params.type];
    if (!Model) return res.status(404).json({ message: "Unknown record type" });
    res.json(await Model.find().sort({ createdAt: -1 }));
  } catch (error) { next(error); }
});
app.post("/api/:type", async (req, res, next) => {
  try {
    const Model = models[req.params.type];
    if (!Model) return res.status(404).json({ message: "Unknown record type" });
    const record = await Model.create(req.body);
    res.status(201).json(record);
  } catch (error) { next(error); }
});
app.put("/api/:type/:id", async (req, res, next) => {
  try {
    const Model = models[req.params.type];
    if (!Model) return res.status(404).json({ message: "Unknown record type" });
    const record = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!record) return res.status(404).json({ message: "Record not found" });
    res.json(record);
  } catch (error) { next(error); }
});
app.delete("/api/:type/:id", async (req, res, next) => {
  try {
    const Model = models[req.params.type];
    if (!Model) return res.status(404).json({ message: "Unknown record type" });
    const record = await Model.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });
    res.json({ message: "Record deleted" });
  } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => {
  console.error(error.message);
  res.status(400).json({ message: error.message || "Something went wrong" });
});

const port = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/school_bus_management")
  .then(() => app.listen(port, () => console.log(`API ready at http://localhost:${port}`)))
  .catch((error) => { console.error("MongoDB connection failed:", error.message); process.exit(1); });
