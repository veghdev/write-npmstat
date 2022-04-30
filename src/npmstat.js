const fs = require("fs");

const npm = require("npm-stat-api");
const Enum = require("enum");
const csv = require("csv-parser");
const createCsvWriter = require("csv-writer").createArrayCsvWriter;

const StatDate = require("./statdate.js");

/**
 * Enum for statistics grouping (year, month, day, null)
 * @readonly
 * @enum {string|null}
 */
const StatPeriod = new Enum(
    ["year", "month", "day", null],
    { ignoreCase: true },
    { freeze: true }
);

/**
 * Class to collect, filter and save npm statistics to csv files
 * @property {string|null} [outDir] - path of the directory where
 *     the gathered data will be saved into csv files
 * @property {StatPeriod} [datePeriod=year] - grouping of the statistics
 * @property {boolean} [writePackageName=false] - flag used to write the name of the package into a csv column
 * @property {boolean} [mergeStoredData=true] - flag used to merge actual npm statistics with previously stored
 */
class WriteNpmStat {
    #packageName;
    outDir;

    #datePeriod;
    #writePackageName;
    #mergeStoredData;

    /**
     * Initialize WriteNpmStat class
     * @param {string} packageName - name of the target npm package
     * @param {string|null} [outDir] - path of the directory where
     *     the gathered data will be saved into csv files
     */
    constructor(packageName, outDir) {
        if (!packageName) {
            throw new Error("packageName is a required argument");
        }

        this.#packageName = packageName;
        this.outDir = outDir;

        this.#datePeriod = StatPeriod.year;
        this.#writePackageName = false;
        this.#mergeStoredData = true;
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

    get writePackageName() {
        return this.#writePackageName;
    }

    set writePackageName(writePackageName) {
        this.#writePackageName = Boolean(writePackageName);
    }

    get mergeStoredData() {
        return this.#mergeStoredData;
    }

    set mergeStoredData(mergeStoredData) {
        this.#mergeStoredData = Boolean(mergeStoredData);
    }

    /**
     * Returns npm statistics for a package
     * @param {string|null} [startDate] - start date of the statistics
     *    should be in one of the following formats:
     *
     *    <br>&nbsp;&nbsp; - "%Y", for example "2022", which means to be collected from "2022-01-01"
     *
     *    <br>&nbsp;&nbsp; - "%Y-%m", for example "2022-01", which means to be collected from "2022-01-01"
     *
     *    <br>&nbsp;&nbsp; - "%Y-%m-%d", for example "2022-01-01", which means to be collected from "2022-01-01"
     *
     *    <br>&nbsp;&nbsp; - undefined, which means to be collected from the last half year
     * @param {string|null} [endDate] - end date of the statistics
     *     should be in one of the following formats:
     *
     *     <br>&nbsp;&nbsp; - "%Y", for example "2022", which means to be collected until "2022-12-31"
     *
     *     <br>&nbsp;&nbsp; - "%Y-%m", for example "2022-12", which means to be collected until "2022-12-31"
     *
     *     <br>&nbsp;&nbsp; - "%Y-%m-%d", for example "2022-12-31", which means to be collected until "2022-12-31"
     *
     *     <br>&nbsp;&nbsp; - undefined, which means to be collected until the actual day
     * @returns {Promise} Promise object represents the npm statistics for a package
     */
    getNpmStat(startDate, endDate) {
        const statDate = new StatDate(startDate, endDate);
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

    static getDays(startDate, endDate) {
        const arr = [];
        const dt = new Date(startDate);
        for (dt; dt <= new Date(endDate); dt.setDate(dt.getDate() + 1)) {
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
                const statKey = res.start;
                const statValues = [];
                statValues.push(res.start);
                if (this.writePackageName) {
                    statValues.push(this.#packageName);
                }
                statValues.push(res.downloads);
                return resolve([statKey, statValues]);
            });
        });
    }

    /**
     * Writes npm statistics for a package
     * @param {string|null} [startDate] - start date of the statistics
     *     should be in one of the following formats:
     *
     *     <br>&nbsp;&nbsp; - "%Y", for example "2022", which means to be collected from "2022-01-01"
     *
     *     <br>&nbsp;&nbsp; - "%Y-%m", for example "2022-01", which means to be collected from "2022-01-01"
     *
     *     <br>&nbsp;&nbsp; - "%Y-%m-%d", for example "2022-01-01", which means to be collected from "2022-01-01"
     *
     *     <br>&nbsp;&nbsp; - undefined, which means to be collected from the last half year
     * @param {string|null} [endDate] - end date of the statistics
     *     should be in one of the following formats:
     *
     *     <br>&nbsp;&nbsp; - "%Y", for example "2022", which means to be collected until "2022-12-31"
     *
     *     <br>&nbsp;&nbsp; - "%Y-%m", for example "2022-12", which means to be collected until "2022-12-31"
     *
     *     <br>&nbsp;&nbsp; - "%Y-%m-%d", for example "2022-12-31", which means to be collected until "2022-12-31"
     *
     *     <br>&nbsp;&nbsp; - undefined, which means to be collected until the actual day
     * @param {string|null} [endDate=npmstat] - postfix of the csv file
     * @returns {Promise} Promise object represents the npm statistics for a package
     */
    writeNpmStat(startDate, endDate, postfix = "npmstat") {
        return new Promise((resolve) => {
            const stats = this.getNpmStat(startDate, endDate);
            stats.then((stats) => {
                const grouped = this.#groupStats(
                    stats,
                    startDate,
                    endDate,
                    postfix
                );
                this.#mergeStats(grouped).then((merged) => {
                    this.#writeStats(merged);
                    return resolve(merged);
                });
            });
        });
    }

    #groupStats(stats, startDate, endDate, postfix) {
        const statDate = new StatDate(startDate, endDate);
        const days = WriteNpmStat.getDays(statDate.start, statDate.end);
        const grouped = {};
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
                    grouped[prefix + "_" + postfix + ".csv"] = [
                        [day, stats[day]],
                    ];
                } else {
                    grouped[prefix + "_" + postfix + ".csv"].push([
                        day,
                        stats[day],
                    ]);
                }
            });
        } else {
            grouped[postfix + ".csv"] = [];
            days.forEach((day) => {
                grouped[postfix + ".csv"].push([day, stats[day]]);
            });
        }
        return grouped;
    }

    #mergeStats(stats) {
        return new Promise((resolve) => {
            if (!this.mergeStoredData) {
                return resolve(stats);
            }
            const csvFiles = {};
            const csvFilesReady = [];
            for (const [key, value] of Object.entries(stats)) {
                const csvFileReady = this.#readCsv(key, value[0]);
                csvFilesReady.push(csvFileReady);
                csvFileReady.then((csvData) => {
                    Object.assign(csvFiles, csvData);
                });
            }
            Promise.all(csvFilesReady).then(() => {
                for (const [key] of Object.entries(stats)) {
                    if (csvFiles[key]) {
                        stats[key] = csvFiles[key].concat(stats[key]);
                    }
                }
                return resolve(stats);
            });
        });
    }

    #readCsv(csvFile, firstNewLine) {
        return new Promise((resolve) => {
            const csvData = {};
            csvData[csvFile] = [];
            if (!this.outDir) {
                return resolve(csvData);
            }
            const csvFilePath = this.outDir + "/" + csvFile;
            const writePackageName = this.writePackageName;
            fs.stat(csvFilePath, function (err) {
                if (err != null) {
                    return resolve(csvData);
                }
                fs.createReadStream(csvFilePath)
                    .pipe(csv())
                    .on("data", (row) => {
                        if (firstNewLine) {
                            if (row.date < firstNewLine[0]) {
                                const statKey = row.date;
                                const statValues = [];
                                statValues.push(row.date);
                                if (writePackageName) {
                                    statValues.push(row.package);
                                }
                                statValues.push(row.downloads);
                                csvData[csvFile].push([statKey, statValues]);
                            }
                        }
                    })
                    .on("end", () => {
                        return resolve(csvData);
                    });
            });
        });
    }

    #writeStats(stats) {
        if (this.outDir) {
            fs.mkdir(this.outDir, { recursive: true }, (err) => {
                if (err) {
                    throw err;
                }
                for (const [key, value] of Object.entries(stats)) {
                    const csvFilePath = this.outDir + "/" + key;
                    const csvWriter = createCsvWriter({
                        path: csvFilePath,
                        header: this.writePackageName
                            ? ["date", "package", "downloads"]
                            : ["date", "downloads"],
                    });
                    const postProcessedStats = [];
                    value.forEach((stat) => {
                        postProcessedStats.push(stat[1]);
                    });
                    csvWriter.writeRecords(postProcessedStats).catch((err) => {
                        throw err;
                    });
                }
            });
        }
    }
}

module.exports = WriteNpmStat;
