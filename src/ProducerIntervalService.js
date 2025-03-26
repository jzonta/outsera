class ProducerIntervalService {
    constructor(db) {
        this.db = db;
    }

    getProducerIntervals(callback) {
        this.db.all(`SELECT year, producers FROM movies WHERE winner = 'yes'`, (err, rows) => {
            if (err) return callback(err);

            const producerWins = {};

            rows.forEach(row => {
                const producers = row.producers.split(/,/).map(p => p.trim());
                producers.forEach(producer => {
                    if (!producerWins[producer]) producerWins[producer] = [];
                    producerWins[producer].push(parseInt(row.year));
                });
            });

            const intervals = [];
            Object.entries(producerWins).forEach(([producer, years]) => {
                years.sort((a, b) => a - b);
                for (let i = 1; i < years.length; i++) {
                    intervals.push({
                        producer,
                        interval: years[i] - years[i - 1],
                        previousWin: years[i - 1],
                        followingWin: years[i]
                    });
                }
            });

            if (intervals.length === 0) return callback(null, { min: [], max: [] });

            const minIntervalValue = Math.min(...intervals.map(i => i.interval));
            const maxIntervalValue = Math.max(...intervals.map(i => i.interval));

            const minIntervals = intervals.filter(i => i.interval === minIntervalValue);
            const maxIntervals = intervals.filter(i => i.interval === maxIntervalValue);

            callback(null, { min: minIntervals, max: maxIntervals });
        });
    }
}

module.exports = ProducerIntervalService;
