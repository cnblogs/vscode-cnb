import { GotFetchResponse } from 'got-fetch/out/lib/response'
import { Response as GotResponse } from 'got'
import { IErrorResponse, isErrorResponse } from '@/model/error-response'
import iconv from 'iconv-lite'

export async function throwIfNotOkResponse(response: GotFetchResponse) {
    if (response.ok) return

    const responseText = await response.text()
    let responseJson: unknown
    try {
        responseJson = JSON.parse(responseText)
    } catch {
        // ignore
    }

    if (isErrorResponse(responseJson)) {
        throw Object.assign(responseJson, { statusCode: response.status } as IErrorResponse)
    } else {
        // eslint-disable-next-line no-throw-literal
        throw {
            errors: [`状态码: ${response.status}(${response.statusText})`, responseText],
            type: -1,
            statusCode: -1,
        } as IErrorResponse
    }
}

export function throwIfNotOkGotResponse(response: GotResponse<Buffer>) {
    if (response.ok) return

    const responseText = iconv.decode(response.rawBody, 'utf-8')
    let responseJson: unknown
    try {
        responseJson = JSON.parse(responseText)
    } catch {
        // ignore
    }

    if (isErrorResponse(responseJson)) {
        throw Object.assign(responseJson, { statusCode: response.statusCode } as IErrorResponse)
    } else {
        // eslint-disable-next-line no-throw-literal
        throw {
            errors: [`状态码: ${response.statusCode}(${response.statusMessage})`, responseText],
            type: -1,
            statusCode: -1,
        } as IErrorResponse
    }
}
