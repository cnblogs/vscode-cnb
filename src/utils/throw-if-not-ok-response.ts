import { GotFetchResponse } from 'got-fetch/out/lib/response';
import { Response as GotResponse } from 'got';
import { IErrorResponse, isErrorResponse } from '../models/error-response';
import iconv from 'iconv-lite';

const throwIfNotOkResponse = async (response: GotFetchResponse) => {
    if (!response.ok) {
        const responseText = await response.text();
        let responseJson: unknown;
        try {
            responseJson = JSON.parse(responseText);
        } catch {
            // ignore
        }
        throw isErrorResponse(responseJson)
            ? Object.assign(responseJson, { statusCode: response.status } as IErrorResponse)
            : ({
                  errors: [`状态码: ${response.status}(${response.statusText})`, responseText],
                  type: -1,
                  statusCode: -1,
              } as IErrorResponse);
    }
};

const throwIfNotOkGotResponse = (response: GotResponse<Buffer>) => {
    if (!response.ok) {
        const responseText = iconv.decode(response.rawBody, 'utf-8');
        let responseJson: unknown;
        try {
            responseJson = JSON.parse(responseText);
        } catch {
            // ignore
        }
        throw isErrorResponse(responseJson)
            ? Object.assign(responseJson, { statusCode: response.statusCode } as IErrorResponse)
            : ({
                  errors: [`状态码: ${response.statusCode}(${response.statusMessage})`, responseText],
                  type: -1,
                  statusCode: -1,
              } as IErrorResponse);
    }
};

export { throwIfNotOkResponse, throwIfNotOkGotResponse };
