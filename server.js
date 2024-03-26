const express = require('express');
const csv = require('csv-parser');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const rateLimit = require('express-rate-limit');

const app = express();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, 
    max: 20
});
app.use(limiter);

const db = new sqlite3.Database(':memory:');
db.serialize(() => {
    db.run("CREATE TABLE bikes (ID INTEGER, Nimi TEXT, Namn TEXT, Name TEXT, Osoite TEXT, Adress TEXT, Kaupunki TEXT, Stad TEXT, Operaattor TEXT, Kapasiteet INTEGER, x REAL, y REAL)");

    fs.createReadStream('./data/bike.csv')
        .pipe(csv())
        .on('data', (row) => {
            db.run(`INSERT INTO bikes (ID, Nimi, Namn, Name, Osoite, Adress, Kaupunki, Stad, Operaattor, Kapasiteet, x, y) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                row.ID, row.Nimi, row.Namn, row.Name, row.Osoite, row.Adress, row.Kaupunki, row.Stad, row.Operaattor, row.Kapasiteet, row.x, row.y
            ]);
        })
        .on('end', () => {
            console.log('CSV file successfully processed and data inserted into the database');
        });
});

app.get('/bikes', (req, res) => {
    db.all("SELECT ID, Nimi, Namn, Name, Osoite, Adress, Kaupunki, Stad, Operaattor, Kapasiteet, x, y FROM bikes", (err, rows) => {
        if (err) {
            res.status(500).send('Internal Server Error');
            return;
        }
        res.json(rows);
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
