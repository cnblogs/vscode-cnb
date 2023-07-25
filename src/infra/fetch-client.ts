import httpClient from '@/infra/http-client'
import { createFetch } from 'got-fetch'

const fetch = createFetch(httpClient)

export * from 'got-fetch'
export default fetch
