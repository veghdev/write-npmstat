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

const packageName = "npm-stat-api";
const outDir = "stats/npm-stat-api";
const writenpmstat = new WriteNpmStat(packageName, outDir);

writenpmstat.datePeriod = "month";
writenpmstat.writeNpmStat("2022", "2022-03");
```

# Contributing

We welcome contributions to the project, visit our [contributing](https://github.com/veghdev/write-npmstat/blob/main/CONTRIBUTING.md) guide for further info.

# Contact

Join our [discussions](https://github.com/veghdev/write-npmstat/discussions) page if you have any questions or comments.

# License

Copyright © 2022.

Released under the [Apache 2.0 License](https://github.com/veghdev/write-npmstat/blob/main/LICENSE).
