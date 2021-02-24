const welcome = require('cli-welcome')
const pkg = require('../package.json')
const updateNotifier = require('update-notifier')

const {author, description, name, version} = pkg

const init = async () => {
  welcome({
    title: name,
    tagLine: `by ${author.url}\n${description}`,
    clear: true,
    version
  })

  updateNotifier({
    pkg,
    shouldNotifyInNpmScript: true
  }).notify({isGlobal: true})
}

module.exports = init
