import stringify from 'csv-stringify/lib/sync.js'
import chalk from 'chalk'
import wait from './wait.js'

import {writeFileSync} from 'fs'
import {load} from 'js-yaml'
import {Octokit} from '@octokit/core'
import {throttling} from '@octokit/plugin-throttling'
import {paginateRest} from '@octokit/plugin-paginate-rest'

const {blue, dim, inverse, red, yellow} = chalk
const MyOctokit = Octokit.plugin(throttling, paginateRest)

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
 * @async
 * @private
 * @function findActionsUsed
 *
 * @param {import('@octokit/core').Octokit} octokit
 * @param {object} options
 * @param {string} options.owner
 * @param {string} [options.repo=null]
 * @param {boolean} [options.exclude=false]
 *
 * @returns {Action[]}
 */
const findActionsUsed = async (octokit, {owner, repo = null, exclude = false}) => {
  const workflows = []

  /** @type Action[] */
  const actions = []

  let q = `uses in:file path:.github/workflows extension:yml language:yaml`

  if (repo !== null) {
    q += ` repo:${owner}/${repo}`
  } else {
    q += ` user:${owner}`
  }

  try {
    for await (const {data, headers} of octokit.paginate.iterator('GET /search/code', {
      q,
      per_page: 100
    })) {
      if (data.total_count > 0) {
        data.map(item => {
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

      if (headers && headers.link && headers.link.includes('rel="next"')) {
        // wait 20.5s to not hit the 30 requests per minute rate limit
        await wait(20500)
      }
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
        const {jobs} = load(content, 'utf8')

        for (const job in jobs) {
          const {steps} = jobs[job]

          for (const step of steps) {
            const {uses} = step

            if (uses) {
              const isCreatedByGitHub = uses.indexOf('actions/') === 0 || uses.indexOf('github/') === 0

              if (exclude && isCreatedByGitHub) {
                continue
              }

              actions.push({owner, repo: _repo, workflow: path, action: uses})
            }
          }
        }
      }
    }
  } catch (error) {
    if (error.status === 401) {
      throw new Error('Bad credentials')
    }

    console.warn(
      `${owner} cannot be searched either because the resources do not exist or you do not have permission to view them`
    )
  }

  return actions
}

class FindActionUses {
  /**
   * @param {string} token
   * @param {string} enterprise
   * @param {string} owner
   * @param {string} repository
   * @param {string} csv
   * @param {string} md
   * @param {boolean} exclude
   */
  constructor(token, enterprise, owner, repository, csv, md, exclude) {
    this.token = token
    this.enterprise = enterprise
    this.owner = owner
    this.repository = repository
    this.csvPath = csv
    this.mdPath = md
    this.exclude = exclude

    this.octokit = new MyOctokit({
      auth: token,
      throttle: {
        onRateLimit: (retryAfter, options) => {
          console.warn(yellow(`Request quota exhausted for request ${options.method} ${options.url}`))

          if (options.request.retryCount === 0) {
            console.warn(yellow(`Retrying after ${retryAfter} seconds!`))
            return true
          }
        },
        onAbuseLimit: (retryAfter, options) => {
          console.warn(yellow(`Abuse detected for request ${options.method} ${options.url}`))
        }
      }
    })
  }

  /**
   * @returns {Action[]}
   */
  async getActionUses() {
    const {octokit, enterprise, exclude, owner, repository} = this

    console.log(`
Gathering GitHub Action ${inverse('uses')} strings for ${blue(enterprise || owner || repository)}
${dim('(this could take a while...)')}
`)

    if (enterprise) {
      /** @type Action[] */
      const actions = []

      const orgs = await getOrganizations(octokit, enterprise)
      console.log(`${dim(`searching in %s organizations`)}`, orgs.length)

      for await (const org of orgs) {
        console.log(`searching actions for ${org}`)

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

  /**
   * @param {Action[]} actions
   * @returns {string}
   */
  async saveCsv(actions) {
    const {csvPath} = this

    console.log(`saving CSV in ${blue(`${csvPath}`)}`)

    const csv = stringify(
      actions.map(i => [i.owner, i.repo, i.workflow, i.action]),
      {
        header: true,
        columns: ['owner', 'repo', 'workflow', 'action']
      }
    )

    try {
      await writeFileSync(csvPath, csv)
    } catch (error) {
      console.error(red(error.message))
    }

    return csv
  }

  /**
   * @param {Action[]} actions
   * @returns {string}
   */
  async saveMarkdown(actions) {
    const {mdPath} = this

    console.log(`saving markdown in ${blue(`${mdPath}`)}`)

    let md = `owner | repo | workflow | action
----- | ----- | ----- | -----
`

    for (const {owner, repo, workflow, action} of actions) {
      const link = `https://github.com/${owner}/${repo}/blob/HEAD/${workflow}`

      md += `${owner} | ${repo} | [${workflow}](${link}) | ${action}
`
    }

    try {
      writeFileSync(mdPath, md)
    } catch (error) {
      console.error(red(error.message))
    }

    return md
  }
}

/**
 * @typedef {object} Action
 * @property {string} owner
 * @property {string} repo
 * @property {string} workflow
 * @property {string} action
 * @readonly
 */

/**
 * @typedef {object} Organization
 * @property {string} login
 * @readonly
 */

export default FindActionUses
