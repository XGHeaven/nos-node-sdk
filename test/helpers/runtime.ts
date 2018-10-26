import * as fs from 'fs'
import * as tempy from 'tempy'
import * as util from 'util'
import { Readable } from 'stream'

const writeFile = util.promisify(fs.writeFile)

export async function newTempFile(
  options: {
    content?: string | Buffer
    ext?: string
  } = {}
) {
  const filePath = tempy.file({ extension: options.ext || '' })

  if (options.content) {
    await writeFile(filePath, options.content)
  }

  return filePath
}

export function newReadableStream(length: number) {
  let usedSize = 0
  const readable = new Readable({
    read(size) {
      let shouldEnd = false

      if (usedSize + size >= length) {
        size = length - usedSize
        shouldEnd = true
      }

      usedSize += size
      this.push(Buffer.alloc(size))

      if (shouldEnd) {
        this.push(null)
      }
    },
  })

  return readable
}
