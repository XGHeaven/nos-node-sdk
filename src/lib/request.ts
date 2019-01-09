import * as xml from 'fast-xml-parser'
import { Response } from 'node-fetch'
import { camelCaseObject } from './util'

export async function parseBody(resp: Response): Promise<any> {
  const xmlString = await resp.text()
  return camelCaseObject(
    xml.parse(xmlString, {
      // only parse true number
      parseTrueNumberOnly: true,
    })
  )
}
