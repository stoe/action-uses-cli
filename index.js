#!/usr/bin/env node

const handleError = require('cli-handle-error')
const cli = require('./cli/cli.js')
const init = require('./cli/init.js')
const {red} = require('chalk')

const FindActionUses = require('./utils/findActionUses')

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  handleError(`UNHANDLED ERROR`, err)
})

/**
 * Action Uses Cli.
 */
;(async () => {
  try {
    // Init.
    init()

    // Get options/flags
    const {help, version, enterprise, exclude, owner, repository, csv, token} = cli.flags

    help && cli.showHelp(0)
    version && cli.showVersion(0)

    if (!token) {
      throw new Error(`${red('GitHub Personal Access Token (PAT) not provided')}`)
    }

    if (!(enterprise || owner || repository)) {
      throw new Error(`${red('no options provided')}`)
    }

    if ((enterprise && owner) || (enterprise && repository) || (owner && repository)) {
      throw new Error(`${red('can only use one of')} enterprise, owner, repository`)
    }

    if (csv === '') {
      throw new Error(`${red('please provide a valid path for the CSV output')}`)
    }

    const fau = new FindActionUses(token, enterprise, owner, repository, csv, exclude)
    const actions = await fau.getActionUses()

    if (csv) {
      fau.saveCsv(actions)
    } else {
      console.log(actions)
    }
  } catch (error) {
    handleError(error.message, error, false, false)
    cli.showHelp(1)
  }
})()
