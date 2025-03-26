const express = require('express');
const sqlite3 = require('sqlite3');
const MovieDatabaseLoader = require('./MovieDatabaseLoader');
const ProducerIntervalService = require('./ProducerIntervalService');

const app = express();
const port = 3000;
const db = new sqlite3.Database(':memory:');

const dbLoader = new MovieDatabaseLoader(db, 'movielist.csv');
dbLoader.initializeDatabase();

app.get('/', (req, res) => {
    res.send('API Teste Outsera');
});

app.get('/producers/intervals', (req, res) => {
    const producerIntervalService = new ProducerIntervalService(db);
    producerIntervalService.getProducerIntervals((err, result) => {
        if (err) return res.status(500).send(err.message);
        res.json(result);
    });
});

app.listen(port, () => {
    console.log(`API Teste Outsera http://localhost:${port}`);
});