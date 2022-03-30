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
            ? responseJson
            : ({
                  errors: [`状态码: ${response.status}(${response.statusText})`, responseText],
                  type: -1,
              } as IErrorResponse);
    }
};

export { throwIfNotOkResponse };
