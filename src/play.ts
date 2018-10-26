import { NosClient } from './index'

const bucket = process.env.NOS_BUCKET || ''
const client = new NosClient({
  accessKey: process.env.NOS_ACCESS_KEY as string,
  accessSecret: process.env.NOS_ACCESS_SECRET as string,
  endpoint: 'http://nos-eastchina1.126.net',
  defaultBucket: bucket,
})

async function run() {
  // const list = await client.listObject({bucket})
  // const result = await client.putObject(Buffer.from('abc'), 'test.txt', {bucket})
  const result = await client.listObject({
    delimiter: '/',
    limit: 2,
  })
  console.log(JSON.stringify(result, null, 2))
}

run().catch(console.error)
