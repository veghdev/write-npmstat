const fs = require("fs");

const npm = require("npm-stat-api");
const Enum = require("enum");
const createCsvWriter = require("csv-writer").createArrayCsvWriter;

const StatDate = require("./statdate.js");

const StatPeriod = new Enum(
    ["year", "month", "day", null],
    { ignoreCase: true },
    { freeze: true }
);

class WriteNpmStat {
    #packageName;
    outDir;

    #datePeriod;

    constructor(packageName, outDir) {
        if (!packageName) {
            throw new Error("packageName is a required argument");
        }

        this.#packageName = packageName;
        this.outDir = outDir;

        this.#datePeriod = StatPeriod.year;
    }

    get packageName() {
        return this.#packageName;
    }

    get datePeriod() {
        return this.#datePeriod;
    }

    set datePeriod(datePeriod) {
        this.#datePeriod = StatPeriod.get(datePeriod);
    }

    getNpmStat(startDay, endDay) {
        const statDate = new StatDate(startDay, endDay);
        const days = WriteNpmStat.getDays(statDate.start, statDate.end);
        return new Promise((resolve) => {
            const stats = [];
            days.forEach((day) => {
                stats.push(this.#getStat(day, 100));
            });
            Promise.all(stats).then((stats) => {
                resolve(Object.fromEntries(stats));
            });
        });
    }

    static getDays(startDay, endDay) {
        const arr = [];
        const dt = new Date(startDay);
        for (dt; dt <= new Date(endDay); dt.setDate(dt.getDate() + 1)) {
            arr.push(StatDate.formatDate(new Date(dt)));
        }
        return arr;
    }

    #getStat(day, retryLimit, retryCount) {
        retryLimit = retryLimit || Number.MAX_VALUE;
        retryCount = Math.max(retryCount || 0, 0);
        return new Promise((resolve) => {
            npm.stat(this.packageName, day, day, (err, res) => {
                if (err) {
                    if (retryCount < retryLimit) {
                        return this.#getStat(day, retryLimit, retryCount + 1);
                    }
                    throw new Error("retryLimit reached");
                }
                return resolve([res.start, res.downloads]);
            });
        });
    }

    writeNpmStat(startDay, endDay, postfix = "npmstat") {
        return new Promise((resolve) => {
            const stats = this.getNpmStat(startDay, endDay);
            stats.then((stats) => {
                const processedStats = this.#groupStats(
                    stats,
                    startDay,
                    endDay,
                    postfix
                );
                this.#writeStats(processedStats);
                return resolve();
            });
        });
    }

    #groupStats(stats, startDay, endDay, postfix) {
        const statDate = new StatDate(startDay, endDay);
        const days = WriteNpmStat.getDays(statDate.start, statDate.end);
        const processedStats = {};
        if (this.datePeriod) {
            let substring;
            if (this.datePeriod === StatPeriod.year) {
                substring = 4;
            } else if (this.datePeriod === StatPeriod.month) {
                substring = 7;
            } else if (this.datePeriod === StatPeriod.month) {
                substring = 10;
            }
            const initialized = {};
            days.forEach((day) => {
                const prefix = day.substring(0, substring);
                if (!initialized[prefix]) {
                    initialized[prefix] = true;
                    processedStats[prefix + "_" + postfix + ".csv"] = [
                        [day, stats[day]],
                    ];
                } else {
                    processedStats[prefix + "_" + postfix + ".csv"].push([
                        day,
                        stats[day],
                    ]);
                }
            });
        } else {
            processedStats[postfix + ".csv"] = [];
            days.forEach((day) => {
                processedStats[postfix + ".csv"].push([day, stats[day]]);
            });
        }
        console.log(processedStats);
        return processedStats;
    }

    #writeStats(stats) {
        if (this.outDir) {
            fs.mkdir(this.outDir, { recursive: true }, (err) => {
                if (err) {
                    throw err;
                }
                for (const [key, value] of Object.entries(stats)) {
                    const csvWriter = createCsvWriter({
                        path: this.outDir + "/" + key,
                        header: ["date", "download"],
                    });
                    csvWriter.writeRecords(value).catch((err) => {
                        throw err;
                    });
                }
            });
        }
    }
}

module.exports = WriteNpmStat;
