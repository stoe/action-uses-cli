# action-uses-cli

[![Test](https://github.com/stoe/action-uses-cli/actions/workflows/test.yml/badge.svg)](https://github.com/stoe/action-uses-cli/actions/workflows/test.yml) [![CodeQL](https://github.com/stoe/action-uses-cli/actions/workflows/codeql.yml/badge.svg)](https://github.com/stoe/action-uses-cli/actions/workflows/codeql.yml) [![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

> CLI to grab GitHub action `uses` strings

## Install

```sh
$ npm i -g @stoe/action-uses-cli
```

## Usage

```sh
$ action-uses-cli [--options]
```

## Required options (one of)

- `--enterprise`, `-e` GitHub Enterprise Cloud account slug (e.g. `enterprise`)
- `--owner`, `-o` GitHub organization/user login (e.g. `owner`)
  If --owner is a user, results for the authenticated user (--token) will be returned
- `--repository`, `-r` GitHub repository name with owner (e.g. `owner/repo`)

## Additional options

- `--csv` Path to CSV for the output (e.g. `/path/to/action-uses.csv`)
- `--token`, `-t` GitHub Personal Access Token (PAT) (default `GITHUB_TOKEN`)
- `--help`, `-h` Print action-uses-cli help
- `--version`, `-v` Print action-uses-cli version

## Examples

```sh
# Output GitHub Actions `uses` for all repositories under a GitHub Enterprise Cloud account to stdout
$ action-uses-cli -e my-enterprise

# Output GitHub Actions `uses` for all organization repositories to stdout
$ action-uses-cli -o my-org

# Output GitHub Actions `uses` for all user repositories to stdout
$ action-uses-cli -o stoe

# Output GitHub Actions `uses` for the stoe/action-uses-cli repository to stdout
$ action-uses-cli -o stoe/action-uses-cli

# Output GitHub Actions `uses` for all organization repositories to /path/to/action-uses.csv
$ action-uses-cli -o my-org --csv /path/to/action-uses.csv
```

## License

- [MIT](./license) © [Stefan Stölzle](https://github.com/stoe)
- [Code of Conduct](./.github/code_of_conduct.md)
