const gm = require('gm').subClass({ imageMagick: true })
const fs = require('node:fs/promises')
const path = require('path')
const { spawn } = require('node:child_process')
const os = require('os')
const crypto = require('crypto')

const convertPdfToImages = async (toConvert) => {
  const imgFolder = path.join(
    os.tmpdir(),
    crypto
      .createHash('md5')
      .update(toConvert.replace(/.pdf$/, ''))
      .digest('hex'))
  try { await fs.mkdir(imgFolder, { recursive: true }) }
  catch {}
  const imgPath = path.join(imgFolder, `%d.jpg`)

  return new Promise((resolve, reject) => {
    try {
      let _err = []
      const exe = spawn('gs', [
        '-dBATCH',
        '-dNOPAUSE',
        '-sDEVICE=jpeg',
        `-sOutputFile=${imgPath}`,
        '-dTextAlphaBits=4',
        '-r75',
        toConvert])
      exe.stdin.on('error', reject)
      exe.stdout.on('error', reject)
      exe.stderr.on('data', data => _err.push(data))
      exe.on('close', () => _err.length ? reject(_err.map(e => e.toString()).join('')) : resolve(imgFolder))
    } catch (error) {
      throw error
    }
  })
}

const joinImages = async (imgFolder, dest) => {
  const imgs = (await fs.readdir(imgFolder)).map(e => path.join(imgFolder, e))
  let compute = gm(imgs.shift())
  while (imgs.length) compute.append(imgs.shift())
  return new Promise((resolve, reject) => 
    compute.write(dest, err => err ? reject(err) : resolve(dest)))
}

const convertPdfToImage = async (source, dest) => {
  try {
    const imgFolder = await convertPdfToImages(source)
    const imgOut = await joinImages(imgFolder, dest)
    await fs.rm(imgFolder, { recursive: true, force: true })
    return imgOut
  } catch (error) {
    throw error
  }
}

module.exports = { convertPdfToImage }
