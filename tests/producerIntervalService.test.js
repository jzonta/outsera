const sqlite3 = require('sqlite3').verbose();
const ProducerIntervalService = require('../src/ProducerIntervalService');

describe('ProducerIntervalService', () => {
    let db;
    let service;

    beforeEach((done) => {
        db = new sqlite3.Database(':memory:');
        db.serialize(() => {
            db.run(`
                CREATE TABLE movies (
                    year INTEGER,
                    title TEXT,
                    studios TEXT,
                    producers TEXT,
                    winner TEXT
                )
            `, (err) => {
                if (err) throw err;
                service = new ProducerIntervalService(db);
                done();
            });
        });
    });

    test('deve retornar min e max com um conjunto simples de dados', (done) => {
        const mockData = [
            [2000, 'Filme A', 'Estúdio A', 'Produtor 1, Produtor 2', 'yes'],
            [2002, 'Filme B', 'Estúdio B', 'Produtor 1', 'yes'],
            [2005, 'Filme C', 'Estúdio C', 'Produtor 2', 'yes'],
            [2010, 'Filme D', 'Estúdio D', 'Produtor 1', 'yes'],
            [2012, 'Filme E', 'Estúdio E', 'Produtor 2', 'yes'],
        ];
        const stmt = db.prepare(`INSERT INTO movies (year, title, studios, producers, winner) VALUES (?, ?, ?, ?, ?)`);
        mockData.forEach(data => stmt.run(...data));
        stmt.finalize(() => {
            service.getProducerIntervals((err, result) => {
                expect(result.min.length).toBeGreaterThan(0);
                expect(result.max.length).toBeGreaterThan(0);
                done();
            });
        });
    });

    test('deve retornar todos os empatados no intervalo máximo', (done) => {
        const mockData = [
            [2000, 'Filme A', 'Estúdio A', 'Produtor 1', 'yes'],
            [2010, 'Filme B', 'Estúdio B', 'Produtor 1', 'yes'],
            [2015, 'Filme C', 'Estúdio C', 'Produtor 2', 'yes'],
            [2025, 'Filme D', 'Estúdio D', 'Produtor 2', 'yes'],
        ];
        const stmt = db.prepare(`INSERT INTO movies (year, title, studios, producers, winner) VALUES (?, ?, ?, ?, ?)`);
        mockData.forEach(data => stmt.run(...data));
        stmt.finalize(() => {
            service.getProducerIntervals((err, result) => {
                const maxIntervals = Math.max(...result.max.map(i => i.interval));
                const empatados = result.max.filter(i => i.interval === maxIntervals);
                expect(empatados.length).toBeGreaterThan(1);
                done();
            });
        });
    });

    test('deve retornar todos os empatados no intervalo mínimo', (done) => {
        const mockData = [
            [2016, 'Filme A', 'Estúdio A', 'Produtor 3', 'yes'],
            [2017, 'Filme B', 'Estúdio B', 'Produtor 3', 'yes'],
            [2020, 'Filme C', 'Estúdio C', 'Produtor 4', 'yes'],
            [2021, 'Filme D', 'Estúdio D', 'Produtor 4', 'yes'],
        ];
        const stmt = db.prepare(`INSERT INTO movies (year, title, studios, producers, winner) VALUES (?, ?, ?, ?, ?)`);
        mockData.forEach(data => stmt.run(...data));
        stmt.finalize(() => {
            service.getProducerIntervals((err, result) => {
                const minIntervalValue = Math.min(...result.min.map(i => i.interval));
                const empatados = result.min.filter(i => i.interval === minIntervalValue);
                expect(empatados.length).toBeGreaterThan(1);
                done();
            });
        });
    });

    test('produtor com maior intervalo entre dois prêmios consecutivos deve ser identificado corretamente', (done) => {
        const mockData = [
            [2000, 'Filme A', 'Estúdio A', 'Produtor X', 'yes'],
            [2010, 'Filme B', 'Estúdio B', 'Produtor X', 'yes'],
            [2015, 'Filme C', 'Estúdio C', 'Produtor Y', 'yes'],
            [2020, 'Filme D', 'Estúdio D', 'Produtor Y', 'yes'],
        ];
        const stmt = db.prepare(`INSERT INTO movies (year, title, studios, producers, winner) VALUES (?, ?, ?, ?, ?)`);
        mockData.forEach(data => stmt.run(...data));
        stmt.finalize(() => {
            service.getProducerIntervals((err, result) => {
                if (err) throw err;

                const maxIntervals = Math.max(...result.max.map(i => i.interval));
                const max = result.max.find(i => i.interval === maxIntervals);

                expect(max.producer).toBe('Produtor X');
                expect(max.interval).toBe(10);
                expect(max.previousWin).toBe(2000);
                expect(max.followingWin).toBe(2010);

                done();
            });
        });
    });

    test('produtor que obteve dois prêmios mais rápido deve ser identificado corretamente', (done) => {
        const mockData = [
            [2016, 'Filme A', 'Estúdio A', 'Produtor Rápido', 'yes'],
            [2017, 'Filme B', 'Estúdio B', 'Produtor Rápido', 'yes'],
            [2010, 'Filme C', 'Estúdio C', 'Produtor Lento', 'yes'],
            [2020, 'Filme D', 'Estúdio D', 'Produtor Lento', 'yes'],
        ];
        const stmt = db.prepare(`INSERT INTO movies (year, title, studios, producers, winner) VALUES (?, ?, ?, ?, ?)`);
        mockData.forEach(data => stmt.run(...data));
        stmt.finalize(() => {
            service.getProducerIntervals((err, result) => {
                if (err) throw err;

                const minIntervalValue = Math.min(...result.min.map(i => i.interval));
                const faster = result.min.find(i => i.interval === minIntervalValue);

                expect(faster.producer).toBe('Produtor Rápido');
                expect(faster.interval).toBe(1);
                expect(faster.previousWin).toBe(2016);
                expect(faster.followingWin).toBe(2017);

                done();
            });
        });
    });

    afterEach((done) => {
        db.close(done);
    });
});
