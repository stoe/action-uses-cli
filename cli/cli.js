const meow = require('meow')
const {dim, blue, bold, yellow} = require('chalk')

module.exports = meow(
  `
  ${bold('Usage')}
    ${blue(`action-uses-cli`)} ${yellow(`[--options]`)}

  ${bold('Required options')} ${dim('one of')}
    ${yellow(`--enterprise`)}, ${yellow(`-e`)}     GitHub Enterprise Cloud account slug ${dim('(e.g. enterprise)')}
    ${yellow(`--owner`)}, ${yellow(`-o`)}          GitHub organization/user login ${dim('(e.g. owner)')}
                         ${dim(
                           `If ${yellow(`--owner`)} is a user, results for the authenticated user (${yellow(
                             `--token`
                           )}) will be returned`
                         )}
    ${yellow(`--repository`)}, ${yellow(`-r`)}     GitHub repository name with owner ${dim('(e.g. owner/repo)')}

  ${bold('Additional options')}
    ${yellow(`--csv`)}                Path to CSV for the output ${dim('(e.g. /path/to/action-uses.csv)')}
    ${yellow(`--token`)}, ${yellow(`-t`)}          GitHub Personal Access Token (PAT) ${dim('(default GITHUB_TOKEN)')}

    ${yellow(`--help`)}, ${yellow(`-h`)}           Print action-uses-cli help
    ${yellow(`--version`)}, ${yellow(`-v`)}        Print action-uses-cli version

  ${bold('Examples')}
    ${dim('# Output GitHub Actions `uses` for all repositories under a GitHub Enterprise Cloud account to stdout')}
    $ action-uses-cli -e my-enterprise

    ${dim('# Output GitHub Actions `use` for all organization repositories to stdout')}
    $ action-uses-cli -o my-org

    ${dim('# Output GitHub Actions `uses` for all user repositories to stdout')}
    $ action-uses-cli -o stoe

    ${dim('# Output GitHub Actions `uses` for the stoe/action-uses-cli repository to stdout')}
    $ action-uses-cli -o stoe/action-uses-cli

    ${dim('# Output GitHub Actions `uses` for all organization repositories to /path/to/action-uses.csv')}
    $ action-uses-cli -o my-org --csv /path/to/action-uses.csv
`,
  {
    booleanDefault: undefined,
    description: false,
    hardRejection: false,
    allowUnknownFlags: false,
    inferType: false,
    input: [],
    flags: {
      help: {
        type: 'boolean',
        alias: 'h'
      },
      version: {
        type: 'boolean',
        alias: 'v'
      },
      enterprise: {
        type: 'string',
        alias: 'e'
      },
      owner: {
        type: 'string',
        alias: 'o',
        isMultiple: false
      },
      repository: {
        type: 'string',
        alias: 'r',
        isMultiple: false
      },
      csv: {
        type: 'string'
      },
      token: {
        type: 'string',
        alias: 't',
        default: process.env.GITHUB_TOKEN || ''
      }
    }
  }
)
