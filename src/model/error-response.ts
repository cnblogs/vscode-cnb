export interface IErrorResponse {
    errors: string[]
    type: number
    statusCode: number
}

export function isErrorResponse(obj: any): obj is IErrorResponse {
    return obj.type >= -1 && obj.errors !== undefined && obj.errors.length > 0
}
