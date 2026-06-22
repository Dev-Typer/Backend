import { Controller, Get, Injectable, UseGuards } from "@nestjs/common";
import { UserRepository } from "./user.repository";

@Controller('/api/user')
export class UserController {
    constructor(
        private readonly userRepository: UserRepository,
    ) {}

    @Get('/me/core')
    @UseGuards(JwtAuthGuard)
    async getCore(): Promise
}