interface IErrorResponse {
    errors: string[];
    type: number;
    statusCode: number;
}

const isErrorResponse = (obj: any): obj is IErrorResponse => {
    return obj.type >= -1 && obj.errors && obj.errors.length > 0;
};

export { IErrorResponse, isErrorResponse };
