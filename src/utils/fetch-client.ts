import httpClient, { gotOptionsWithBuffer } from '@/utils/http-client';
import { createFetch } from 'got-fetch';

const fetch = createFetch(httpClient);

const fetchWithBuffer = createFetch(gotOptionsWithBuffer);

export * from 'got-fetch';
export default fetch;
export { fetchWithBuffer };
