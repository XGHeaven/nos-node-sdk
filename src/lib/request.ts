import fetch, { Body, BodyInit, Response } from 'node-fetch'
// import axios from 'axios'
import * as xml from 'fast-xml-parser'
import { camelCaseObject } from './util'
// import * as xml from 'xml-js'

export async function request(method: string, url: string, headers: any, body?: BodyInit) {
  const resp = await requestResponse(method, url, headers, body)
  console.log(resp.status)
  const xmlString = await resp.text()
  return xml.parse(xmlString, {
    // don't parse number
    parseTrueNumberOnly: true,
  })
}

export async function requestStream(
  method: string,
  url: string,
  headers: any,
  body?: BodyInit
): Promise<NodeJS.ReadableStream> {
  const resp = await requestResponse(method, url, headers, body)

  return resp.body
}

export async function requestResponse(method: string, url: string, headers: any, body?: BodyInit): Promise<Response> {
  return await fetch(url, {
    method,
    headers,
    body,
  })
}

export async function parseBody(resp: Response): Promise<any> {
  const xmlString = await resp.text()
  return camelCaseObject(
    xml.parse(xmlString, {
      // only parse true number
      parseTrueNumberOnly: true,
    })
  )
}
