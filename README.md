[![CI](https://github.com/veghdev/write-npmstat/workflows/CI/badge.svg?branch=main)](https://github.com/veghdev/write-npmstat/actions/workflows/ci.yml)


# About The Project

write-npmstat makes it easy to collect, filter and save npm statistics to csv files.

# Installation

write-npmstat requires `npm-stat-api`, `enum`, `csv-writer` and `csv-parser` packages.

```sh
npm install write-npmstat
```

# Usage

```js
const WriteNpmStat = require("write-npmstat").default;

const targetPackage = "npm-stat-api";
const csvDir = "stats/npm-stat-api";
const writenpmstat = new WriteNpmStat(targetPackage, csvDir);

writenpmstat.writeNpmStat("2021", "2022-03");

writenpmstat.datePeriod = "month";
writenpmstat.writeNpmStat("2022-01", "2022-04-15");
```

Visit our [documentation](https://veghdev.github.io/write-npmstat/) site for code reference or 
our [wiki](https://veghdev.github.io/write-npmstat/) site for a step-by-step tutorial into write-npmstat.

# Contributing

We welcome contributions to the project, visit our [contributing](https://github.com/veghdev/write-npmstat/blob/main/CONTRIBUTING.md) guide for further info.

# Contact

Join our [discussions](https://github.com/veghdev/write-npmstat/discussions) page if you have any questions or comments.

# License

Copyright © 2022.

Released under the [Apache 2.0 License](https://github.com/veghdev/write-npmstat/blob/main/LICENSE).
