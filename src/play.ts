import { NosBaseClient } from './index'

const bucket = process.env.NOS_BUCKET || ''
const client = new NosBaseClient({
  accessKey: process.env.NOS_ACCESS_KEY as string,
  accessSecret: process.env.NOS_ACCESS_SECRET as string,
  endpoint: 'http://nos-eastchina1.126.net',
  defaultBucket: bucket,
})

async function run() {
  // const list = await client.listObject({bucket})
  // const result = await client.putObject(Buffer.from('abc'), 'test.txt', {bucket})
  const result = await client.deleteObject('test.txt')
  console.log(JSON.stringify(result, null, 2))
}

run().catch(console.error)
