# action-uses-cli

[![test](https://github.com/stoe/action-uses-cli/actions/workflows/test.yml/badge.svg)](https://github.com/stoe/action-uses-cli/actions/workflows/test.yml) [![codeql](https://github.com/stoe/action-uses-cli/actions/workflows/codeql.yml/badge.svg)](https://github.com/stoe/action-uses-cli/actions/workflows/codeql.yml) [![publish](https://github.com/stoe/action-uses-cli/actions/workflows/publish.yml/badge.svg)](https://github.com/stoe/action-uses-cli/actions/workflows/publish.yml) [![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

> CLI to grab GitHub action `uses` strings

## Usage

```sh
$ npx @stoe/action-uses-cli [--options]
```

## Required options (one of)

- `--enterprise`, `-e` GitHub Enterprise Cloud account slug (e.g. `enterprise`)
- `--owner`, `-o` GitHub organization/user login (e.g. `owner`)
  If --owner is a user, results for the authenticated user (--token) will be returned
- `--repository`, `-r` GitHub repository name with owner (e.g. `owner/repo`)

## Additional options

- `--exclude` Exclude actions created by GitHub, i.e. actions from https://github.com/actions and https://github.com/github organizations
- `--unique` List unique GitHub Actions only
- `--csv` Path to CSV file for the output (e.g. `/path/to/action-uses.csv`)
- `--md` Path to markdown file for the output (e.g. `/path/to/action-uses.md`)
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

# Output GitHub Actions `uses` for all organization repositories to /path/to/action-uses.md
$ action-uses-cli -o my-org --md /path/to/action-uses.md
```

## License

[MIT](./license) © [Stefan Stölzle](https://github.com/stoe)
