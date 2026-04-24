# HMS Source Code (C# WinForms Reference)

This file contains the C# logic requested for your local Windows 7 project. The live preview runs a functional web-based version of this logic.

## 1. Database Schema (SQLite)

```sql
CREATE TABLE Staff (
    Id TEXT PRIMARY KEY,
    Username TEXT UNIQUE NOT NULL,
    Password TEXT NOT NULL,
    FullName TEXT NOT NULL,
    Role TEXT NOT NULL,
    NfcUid TEXT UNIQUE,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Patients (
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

CREATE TABLE Appointments (
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

CREATE TABLE Bills (
    Id TEXT PRIMARY KEY,
    PatientId TEXT NOT NULL,
    TotalAmount REAL NOT NULL,
    ServiceDetails TEXT,
    Status TEXT DEFAULT 'Paid',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(PatientId) REFERENCES Patients(Id)
);
```

## 2. DatabaseHelper.cs (C#)

```csharp
using System;
using System.Data.SQLite;
using System.Data;

public class DatabaseHelper
{
    private string connectionString = "Data Source=hms.db;Version=3;";

    public DatabaseHelper()
    {
        InitializeDatabase();
    }

    private void InitializeDatabase()
    {
        using (var connection = new SQLiteConnection(connectionString))
        {
            connection.Open();
            // Execution of the SQL schema script provided above...
        }
    }

    public DataTable ExecuteQuery(string sql, SQLiteParameter[] parameters = null)
    {
        using (var connection = new SQLiteConnection(connectionString))
        {
            connection.Open();
            using (var command = new SQLiteCommand(sql, connection))
            {
                if (parameters != null) command.Parameters.AddRange(parameters);
                using (var adapter = new SQLiteDataAdapter(command))
                {
                    DataTable dt = new DataTable();
                    adapter.Fill(dt);
                    return dt;
                }
            }
        }
    }

    public int ExecuteNonQuery(string sql, SQLiteParameter[] parameters = null)
    {
        using (var connection = new SQLiteConnection(connectionString))
        {
            connection.Open();
            using (var command = new SQLiteCommand(sql, connection))
            {
                if (parameters != null) command.Parameters.AddRange(parameters);
                return command.ExecuteNonQuery();
            }
        }
    }
}
```

## 3. PatientManager.cs (C#)

```csharp
public class PatientManager
{
    private DatabaseHelper db = new DatabaseHelper();

    public void AddPatient(string name, string dob, string blood, string history)
    {
        string sql = "INSERT INTO Patients (Id, FullName, DateOfBirth, BloodType, MedicalHistory) VALUES (@id, @name, @dob, @blood, @history)";
        var parameters = new SQLiteParameter[] {
            new SQLiteParameter("@id", Guid.NewGuid().ToString()),
            new SQLiteParameter("@name", name),
            new SQLiteParameter("@dob", dob),
            new SQLiteParameter("@blood", blood),
            new SQLiteParameter("@history", history)
        };
        db.ExecuteNonQuery(sql, parameters);
    }

    public DataTable GetAllPatients()
    {
        return db.ExecuteQuery("SELECT * FROM Patients");
    }
}
```
