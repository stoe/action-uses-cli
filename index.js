#!/usr/bin/env node

const handleError = require('cli-handle-error')
const cli = require('./cli/cli.js')
const init = require('./cli/init.js')
const {blue, dim, red} = require('chalk')

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
    const {help, version, enterprise, owner, repository, csv, token} = cli.flags

    help && cli.showHelp(0)
    version && cli.showVersion(0)

    if (!(enterprise || owner || repository)) {
      throw new Error(`${red('no options provided')}`)
    }

    if ((enterprise && owner) || (enterprise && repository) || (owner && repository)) {
      throw new Error(`${red('can only use one of')} enterprise, owner, repository`)
    }

    if (csv === '') {
      throw new Error(`${red('please provide a valid path for the CSV output')}`)
    }

    console.log(
      `Gathering GitHub action \`uses\` strings for ${enterprise || owner || repository} ... ${dim(
        'this could take a while'
      )}`
    )
    console.log()

    const fau = new FindActionUses(token, enterprise, owner, repository, csv)
    const actions = await fau.getActionUses()

    if (csv) {
      fau.saveCsv(actions)

      console.log(`CSV saved at ${blue(`${csv}`)}`)
    } else {
      console.log(actions)
    }

    console.log()
    console.log(`Done.`)
  } catch (error) {
    handleError(error.message, error, false, false)
    cli.showHelp(1)
  }
})()
