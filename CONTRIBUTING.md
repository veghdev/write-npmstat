# Contributing

# Issues

You can find our open issues in the project's [issue tracker](https://github.com/veghdev/write-npmstat/issues). Please let us know if you find any issues or have any feature requests there.

# Pull requests

A pull request must contain a linked issue, its title should explain the issue or feature shortly and clearly.

# CI check

The `check` script collects the scripts which are run by the `CI` workflow.
The `CI` workflow invokes the `check-prettier` and the `check-eslint` scripts.

```sh
npm run check
```

## Formatting

The write-npmstat project is formatted with `prettier`.
Run the `check-prettier` script to check that the js files are formatted with `prettier`.

```sh
npm run check-prettier
```

`prettier` can be run with the `prettier` script.

```sh
npm run prettier
```

## Linter

The `eslint` script runs `eslint` over the write-npmstat project.

```sh
npm run eslint
```
