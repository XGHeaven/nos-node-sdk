import * as fs from 'fs'
import * as tempy from 'tempy'
import * as util from 'util'

const writeFile = util.promisify(fs.writeFile)

export async function newTempFile(
  options: {
    content?: string
    ext?: string
  } = {}
) {
  const filePath = tempy.file({extension: options.ext || ''})

  if (options.content) {
    await writeFile(filePath, options.content)
  }

  return filePath
}
