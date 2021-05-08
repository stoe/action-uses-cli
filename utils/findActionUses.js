const fs = require('fs')
const yaml = require('js-yaml')
const stringify = require('csv-stringify/lib/sync')
const {blue, yellow} = require('chalk')
const ora = require('ora')
const spinner = ora()

const {Octokit} = require('@octokit/core')
const {throttling} = require('@octokit/plugin-throttling')

const MyOctokit = Octokit.plugin(throttling)

const ORG_QUERY = `query ($enterprise: String!, $cursor: String = null) {
  enterprise(slug: $enterprise) {
    organizations(first: 25, after: $cursor) {
      nodes {
        login
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}`

/**
 * @typedef {Object} Organization
 * @property {string} login
 * @readonly
 */

/**
 * @async
 * @private
 * @function getOrganizations
 *
 * @param {import('@octokit/core').Octokit} octokit
 * @param {String} enterprise
 * @param {String} [cursor=null]
 * @param {Organization[]} [records=[]]
 *
 * @returns {Organization[]}
 */
const getOrganizations = async (octokit, enterprise, cursor = null, records = []) => {
  if (!enterprise) return records

  const {
    enterprise: {
      organizations: {nodes, pageInfo}
    }
  } = await octokit.graphql(ORG_QUERY, {enterprise, cursor})

  nodes.map(data => {
    /** @type Organization */
    records.push(data.login)
  })

  if (pageInfo.hasNextPage) {
    await getOrganizations(octokit, enterprise, pageInfo.endCursor, records)
  }

  return records
}

/**
 * @typedef Repository
 * @property {string} owner
 * @property {string} repo
 */

/**
 * @async
 * @private
 * @function findActionsUsed
 *
 * @param {import('@octokit/core').Octokit} octokit
 * @param {object} options
 * @param {string} options.owner
 * @param {string} [options.repo=null]
 * @param {exclude} [options.exclude=false]
 *
 * @returns {String[][]}
 */
const findActionsUsed = async (octokit, {owner, repo = null, exclude = false}) => {
  const workflows = []
  const actions = []

  let q = `uses in:file language:yaml path:.github/workflows`

  if (repo !== null) {
    q += ` repo:${owner}/${repo}`
  } else {
    q += ` user:${owner}`
  }

  try {
    const {data} = await octokit.request('GET /search/code', {
      q
    })

    if (data.items && data.items.length > 0) {
      data.items.map(item => {
        const {
          name,
          path,
          repository: {name: r},
          sha
        } = item

        workflows.push({
          owner,
          repo: r,
          name,
          path,
          sha
        })
      })
    }

    for await (const {repo: _repo, path} of workflows) {
      const {data: wf} = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner,
        repo: _repo,
        path
      })

      if (wf.content) {
        const buff = Buffer.from(wf.content, 'base64')
        const content = buff.toString('utf-8')
        const {jobs} = yaml.load(content, 'utf8')

        for (const job in jobs) {
          const {steps} = jobs[job]

          for (const step of steps) {
            const {uses} = step

            if (uses) {
              const isCreatedByGitHub = uses.indexOf('actions/') === 0 || uses.indexOf('github/') === 0

              if (exclude && isCreatedByGitHub) {
                continue
              }

              actions.push([owner, _repo, path, uses])
            }
          }
        }
      }
    }
  } catch (error) {
    spinner.warn(
      `${owner} cannot be searched either because the resources do not exist or you do not have permission to view them`
    )
  }

  spinner.isSpinning & spinner.succeed()

  return actions
}

class FindActionUses {
  /**
   *
   * @param {string} token
   * @param {string} enterprise
   * @param {string} owner
   * @param {string} repository
   * @param {string} csv
   * @param {boolean} exclude
   */
  constructor(token, enterprise, owner, repository, csv, md, exclude) {
    this.token = token
    this.enterprise = enterprise
    this.owner = owner
    this.repository = repository
    this.path = csv || md
    this.exclude = exclude

    this.octokit = new MyOctokit({
      auth: token,
      throttle: {
        onRateLimit: (retryAfter, options) => {
          spinner.warn(yellow(`Request quota exhausted for request ${options.method} ${options.url}`))

          if (options.request.retryCount === 0) {
            spinner.warn(yellow(`Retrying after ${retryAfter} seconds!`))
            return true
          }
        },
        onAbuseLimit: (retryAfter, options) => {
          spinner.warn(yellow(`Abuse detected for request ${options.method} ${options.url}`))
        }
      }
    })
  }

  async getActionUses() {
    const {octokit, enterprise, exclude, owner, repository} = this

    if (enterprise) {
      console.log(`Gathering GitHub action \`uses\` strings for ${enterprise}`)
    } else {
      spinner.start(`Gathering GitHub action \`uses\` strings for ${owner || repository}`)
    }

    if (enterprise) {
      const actions = []

      const orgs = await getOrganizations(octokit, enterprise)

      for await (const org of orgs) {
        spinner.start(`searching actions for ${org}`)

        const res = await findActionsUsed(octokit, {owner: org, exclude})
        actions.push(...res)
      }

      return actions
    }

    if (owner) {
      return await findActionsUsed(octokit, {owner, exclude})
    }

    const [repoOwner, repo] = repository.split('/')

    return await findActionsUsed(octokit, {owner: repoOwner, repo, exclude})
  }

  async saveCsv(actions) {
    const {path} = this

    spinner.start(`saving CSV in ${blue(`${path}`)}`)

    const csv = stringify(actions, {
      header: true,
      columns: ['owner', 'repo', 'workflow', 'uses']
    })

    try {
      fs.writeFileSync(path, csv)

      spinner.succeed()
    } catch (error) {
      spinner.fail(error.message)
    }
  }

  async saveMarkdown(actions) {
    const {path} = this

    spinner.start(`saving markdown in ${blue(`${path}`)}`)

    let md = `| owner | repo | path | uses |
| ----- | ---- | ---- | ---- |
`

    for (const [owner, repo, file, uses] of actions) {
      md += `| ${owner} | ${repo} | ${file} | ${uses} |
`
    }

    try {
      fs.writeFileSync(path, md)

      spinner.succeed()
    } catch (error) {
      spinner.fail(error.message)
    }
  }
}

module.exports = FindActionUses
