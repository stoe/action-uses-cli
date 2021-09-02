#!/usr/bin/env node

import FindActionUses from './utils/FindActionUses.mjs'
import chalk from 'chalk'
import meow from 'meow'

const {dim, blue, bold, red, yellow} = chalk
const cli = meow(
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
    ${yellow(`--exclude`)}            Exclude actions created by GitHub
                         ${dim(
                           'i.e. actions from https://github.com/actions and https://github.com/github organizations'
                         )}
    ${yellow(`--unique`)}             List unique GitHub Actions only
    ${yellow(`--csv`)}                Path to CSV for the output ${dim('(e.g. /path/to/action-uses.csv)')}
    ${yellow(`--md`)}                 Path to markdown for the output ${dim('(e.g. /path/to/action-uses.md)')}
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
    $ action-uses-cli -r stoe/action-uses-cli

    ${dim('# Output GitHub Actions `uses` for all organization repositories to /path/to/action-uses.csv')}
    $ action-uses-cli -o my-org --csv /path/to/action-uses.csv

    ${dim('# Output GitHub Actions `uses` for all organization repositories to /path/to/action-uses.md')}
    $ action-uses-cli -o my-org --md /path/to/action-uses.md
`,
  {
    booleanDefault: undefined,
    description: false,
    hardRejection: false,
    allowUnknownFlags: false,
    importMeta: import.meta,
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
      exclude: {
        type: 'boolean',
        default: false
      },
      unique: {
        type: 'boolean',
        default: false
      },
      csv: {
        type: 'string'
      },
      md: {
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

// action
;(async () => {
  try {
    // Get options/flags
    const {help, version, enterprise, exclude, unique, owner, repository, csv, md, token} = cli.flags

    help && cli.showHelp(0)
    version && cli.showVersion(0)

    if (!token) {
      throw new Error('GitHub Personal Access Token (PAT) not provided')
    }

    if (!(enterprise || owner || repository)) {
      throw new Error('no options provided')
    }

    if ((enterprise && owner) || (enterprise && repository) || (owner && repository)) {
      throw new Error('can only use one of: enterprise, owner, repository')
    }

    if (csv === '') {
      throw new Error('please provide a valid path for the CSV output')
    }

    if (md === '') {
      throw new Error('please provide a valid path for the markdown output')
    }

    const fau = new FindActionUses(token, enterprise, owner, repository, csv, md, exclude)
    const actions = await fau.getActionUses(unique)

    // create and save CSV
    if (csv) {
      fau.saveCsv(actions, unique)
    }

    // create and save markdown
    if (md) {
      fau.saveMarkdown(actions, unique)
    }

    // always output JSON to stdout
    console.log(JSON.stringify(actions, null, 2))
  } catch (error) {
    console.error(`\n  ${red('ERROR: %s')}`, error.message)
    cli.showHelp(1)
  }
})()
