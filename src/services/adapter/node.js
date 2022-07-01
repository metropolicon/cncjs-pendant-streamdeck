import jwt from 'jsonwebtoken'
import cliOptions from '../cli-options'
const fsModule = require('fs')
const path = require('path')
const { Worker } = require('worker_threads')
const fs = fsModule.promises
const chalk = require('chalk')
const getUserHome = function () {
  return process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME']
}

const getSecret = async (secret) => {
  if (secret) {
    return secret
  }
  try {
    const cncrc = path.resolve(getUserHome(), '.cncrc')
    const data = await fs.readFile(cncrc, 'utf8')
    const config = JSON.parse(data)
    return config.secret
  } catch (e) {}
}

export const fetchConfig = async () => {
  const data = await fs.readFile('src/public/config.json', 'utf8')
  return JSON.parse(data)
}

export const getOptions = () => cliOptions()

export const getAccessToken = async (secret, expiration) => {
  secret = await getSecret(secret)
  if (!secret) {
    console.error(
      chalk.red('Secret is required, see --secret command line option')
    )
    process.exit(1)
  }
  const payload = { id: '', name: 'cncjs-pendant' }
  return jwt.sign(payload, secret, {
    expiresIn: expiration,
  })
}

export const GcodeWorker = () => {
  return new Worker(path.resolve(__dirname, 'gcode-thread-worker.js'), {
    type: 'module',
  })
}

export const onWorkerMessage = (fn) => {
  const parentPort = require('worker_threads').parentPort
  const postMessage = parentPort.postMessage
  parentPort.on('message', (...args) => {
    fn(postMessage, ...args)
  })
}
export const onWorkerEvent = (worker, event, callback) => {
  worker.on(event, callback)
}

export const offWorkerEvent = (worker, event, callback) => {
  worker.removeListener(event, callback)
}
