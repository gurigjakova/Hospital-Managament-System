import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";

// Initialize Database
const dbPath = path.join(process.cwd(), "hms.db");
const db = new Database(dbPath);

// Database Schema Initialization
db.exec(`
  CREATE TABLE IF NOT EXISTS Staff (
    Id TEXT PRIMARY KEY,
    Username TEXT UNIQUE NOT NULL,
    Password TEXT NOT NULL,
    FullName TEXT NOT NULL,
    Role TEXT NOT NULL,
    NfcUid TEXT UNIQUE,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Patients (
    Id TEXT PRIMARY KEY,
    FullName TEXT NOT NULL,
    DateOfBirth DATE,
    Gender TEXT,
    BloodType TEXT,
    MedicalHistory TEXT,
    Phone TEXT,
    Address TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Appointments (
    Id TEXT PRIMARY KEY,
    PatientId TEXT NOT NULL,
    DoctorId TEXT NOT NULL,
    AppointmentDate DATETIME NOT NULL,
    Reason TEXT,
    Status TEXT DEFAULT 'Waiting',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(PatientId) REFERENCES Patients(Id),
    FOREIGN KEY(DoctorId) REFERENCES Staff(Id)
  );

  CREATE TABLE IF NOT EXISTS Bills (
    Id TEXT PRIMARY KEY,
    PatientId TEXT NOT NULL,
    TotalAmount REAL NOT NULL,
    ServiceDetails TEXT,
    Status TEXT DEFAULT 'Paid',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(PatientId) REFERENCES Patients(Id)
  );
`);

// Seed Admin User if not exists
const adminCheck = db.prepare("SELECT * FROM Staff WHERE Username = 'admin'").get();
if (!adminCheck) {
  const insertStaff = db.prepare("INSERT INTO Staff (Id, Username, Password, FullName, Role, NfcUid) VALUES (?, ?, ?, ?, ?, ?)");
  insertStaff.run(uuidv4(), "admin", "admin123", "System Administrator", "Admin", "CARD_001");
  
  // Seed Doctors
  insertStaff.run(uuidv4(), "dr_smith", "password", "Dr. Sarah Smith", "Doctor", "CARD_002");
  insertStaff.run(uuidv4(), "dr_jones", "password", "Dr. Alan Jones", "Doctor", "CARD_003");
  insertStaff.run(uuidv4(), "dr_miller", "password", "Dr. Rebecca Miller", "Doctor", "CARD_004");
  insertStaff.run(uuidv4(), "dr_wilson", "password", "Dr. Gregory Wilson", "Doctor", "CARD_005");
  insertStaff.run(uuidv4(), "dr_davis", "password", "Dr. Michael Davis", "Doctor", "CARD_006");
  insertStaff.run(uuidv4(), "dr_brown", "password", "Dr. Emily Brown", "Doctor", "CARD_007");

  // Seed some initial patients
  const insertPatient = db.prepare("INSERT INTO Patients (Id, FullName, DateOfBirth, Gender, BloodType, MedicalHistory, Phone, Address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  insertPatient.run(uuidv4(), "Marcus Richardson", "1985-06-15", "Male", "A+", "No known allergies.", "+1-202-555-0125", "123 Maple St, Springfield");
  insertPatient.run(uuidv4(), "Sarah Jenkins", "1992-03-24", "Female", "O-", "Asthma history.", "+1-202-555-0144", "456 Oak Rd, Riverdale");
  insertPatient.run(uuidv4(), "Lila Montgomery", "1978-11-02", "Female", "B+", "Hypertension.", "+1-202-555-0199", "789 Pine Ln, Hill Valley");
  insertPatient.run(uuidv4(), "Jonathan Swift", "1990-05-12", "Male", "AB-", "Type 1 Diabetes.", "+1-202-555-0211", "321 Cedar St, Plainsboro");
  insertPatient.run(uuidv4(), "Elena Gilbert", "1995-09-22", "Female", "O+", "Gluten intolerance.", "+1-202-555-0233", "555 White Oak Dr, Mystic Falls");
  insertPatient.run(uuidv4(), "Bruce Wayne", "1980-02-19", "Male", "B-", "Chest trauma history.", "+1-202-555-0911", "1007 Mountain Dr, Gotham");
  insertPatient.run(uuidv4(), "Diana Prince", "1988-12-04", "Female", "A-", "Superb health.", "+1-202-555-1011", "Gateway City Blvd");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- API Routes ---

  // Auth: Login
  app.post("/api/login", (req, res) => {
    const { username, password, nfcUid } = req.body;
    console.log(`Login attempt: user=${username}, pass=${password}, nfc=${nfcUid}`);
    
    // Simulate NFC card login
    if (nfcUid) {
      const user = db.prepare("SELECT Id, Username, FullName, Role FROM Staff WHERE NfcUid = ?").get(nfcUid);
      if (user) {
        console.log(`NFC Login success for ${user.Username}`);
        return res.json({ success: true, user });
      }
    }

    // New logic: Accept any username if password is "12345"
    if (password === "12345") {
      console.log(`Master Login success for ${username}`);
      return res.json({ 
        success: true, 
        user: { 
          Id: "MASTER-LOGIN", 
          Username: username || "Guest", 
          FullName: username || "Clinical Officer", 
          Role: "Admin" 
        } 
      });
    }

    // Standard database check
    const user = db.prepare("SELECT Id, Username, FullName, Role FROM Staff WHERE Username = ? AND Password = ?").get(username, password);
    if (user) {
      console.log(`DB Login success for ${user.Username}`);
      return res.json({ success: true, user });
    }

    console.log(`Login failed for ${username}`);
    res.status(401).json({ success: false, message: "Invalid credentials or NFC card" });
  });

  // Patients CRUD
  app.get("/api/patients", (req, res) => {
    const patients = db.prepare("SELECT * FROM Patients ORDER BY CreatedAt DESC").all();
    res.json(patients);
  });

  app.post("/api/patients", (req, res) => {
    const { FullName, DateOfBirth, Gender, BloodType, MedicalHistory, Phone, Address } = req.body;
    const id = uuidv4();
    try {
      db.prepare("INSERT INTO Patients (Id, FullName, DateOfBirth, Gender, BloodType, MedicalHistory, Phone, Address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .run(id, FullName, DateOfBirth, Gender, BloodType, MedicalHistory, Phone, Address);
      res.json({ success: true, id });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.put("/api/patients/:id", (req, res) => {
    const { FullName, DateOfBirth, Gender, BloodType, MedicalHistory, Phone, Address } = req.body;
    try {
      db.prepare("UPDATE Patients SET FullName=?, DateOfBirth=?, Gender=?, BloodType=?, MedicalHistory=?, Phone=?, Address=? WHERE Id=?")
        .run(FullName, DateOfBirth, Gender, BloodType, MedicalHistory, Phone, Address, req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.delete("/api/patients/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM Patients WHERE Id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Appointments
  app.get("/api/appointments", (req, res) => {
    const appointments = db.prepare(`
      SELECT A.*, P.FullName as PatientName, S.FullName as DoctorName 
      FROM Appointments A
      JOIN Patients P ON A.PatientId = P.Id
      JOIN Staff S ON A.DoctorId = S.Id
      ORDER BY AppointmentDate ASC
    `).all();
    res.json(appointments);
  });

  app.post("/api/appointments", (req, res) => {
    const { PatientId, DoctorId, AppointmentDate, Reason } = req.body;
    const id = uuidv4();
    db.prepare("INSERT INTO Appointments (Id, PatientId, DoctorId, AppointmentDate, Reason) VALUES (?, ?, ?, ?, ?)")
      .run(id, PatientId, DoctorId, AppointmentDate, Reason);
    res.json({ success: true, id });
  });

  app.patch("/api/appointments/:id/status", (req, res) => {
    const { Status } = req.body;
    db.prepare("UPDATE Appointments SET Status = ? WHERE Id = ?").run(Status, req.params.id);
    res.json({ success: true });
  });

  // Doctors / Staff
  app.get("/api/doctors", (req, res) => {
    const doctors = db.prepare("SELECT Id, FullName FROM Staff WHERE Role = 'Doctor'").all();
    res.json(doctors);
  });

  // Billing
  app.post("/api/bills", (req, res) => {
    const { PatientId, TotalAmount, ServiceDetails } = req.body;
    const id = uuidv4();
    db.prepare("INSERT INTO Bills (Id, PatientId, TotalAmount, ServiceDetails) VALUES (?, ?, ?, ?)")
      .run(id, PatientId, TotalAmount, ServiceDetails);
    res.json({ success: true, id });
  });

  // --- Vite / Frontend Serving ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ClinicFlow HMS Server running on http://localhost:${PORT}`);
  });
}

startServer();
