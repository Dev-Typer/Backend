import { HttpStatus } from '@nestjs/common';

export class ApiResponse<T> {
    readonly timestamp: string;

    constructor(
        public readonly success: boolean,
        public readonly statusCode: number,
        public readonly data?: T,
        public readonly message?: string,
        public readonly code?: string,
    ) {
        this.timestamp = new Date().toISOString();
    }

    static success<T>(data: T, statusCode: HttpStatus): ApiResponse<T> {
        return new ApiResponse(true, statusCode, data);
    }

    static fail(message: string, statusCode: HttpStatus, code?: string): ApiResponse<undefined> {
        return new ApiResponse(false, statusCode, undefined, message, code);
    }
}
