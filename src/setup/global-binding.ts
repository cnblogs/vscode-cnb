/* eslint-disable */

import fetch, { Headers, Request, Response } from 'node-fetch'

// @ts-ignore
global.fetch = fetch
// @ts-ignore
global.Headers = Headers
// @ts-ignore
global.Request = Request
// @ts-ignore
global.Response = Response

import { Blob, File, FormData } from 'formdata-node'

global.FormData = FormData
global.Blob = Blob
global.File = File
