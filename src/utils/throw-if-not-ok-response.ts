import { Response } from 'node-fetch';
import { IErrorResponse, isErrorResponse } from '../models/error-response';

const throwIfNotOkResponse = async (response: Response) => {
    if (!response.ok) {
        const responseText = await response.text();
        let responseJson = {};
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

export { throwIfNotOkResponse };
