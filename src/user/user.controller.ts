import { Controller, Get, HttpStatus, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { ApiResponse } from "src/common/dto/api-response";
import type { JwtUser } from "src/common/types/jwt-user.type";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { UserCoreDto } from "./dto/user-core.dto";
import type { UserCoreHistoryDto } from "./dto/user-core-history.dto";
import { UserService } from "./user.service";

@Controller('/api/user')
export class UserController {
    constructor(
        private readonly userService: UserService,
    ) {}

    @Get('/me/core')
    @UseGuards(JwtAuthGuard)
    async getMyCoreInfo(@CurrentUser() user: JwtUser): Promise<ApiResponse<UserCoreDto>> {
        const response = await this.userService.getMyCoreInfo(user.userId);
        return ApiResponse.success(response, HttpStatus.OK);
    }

    @Get('/me/core/history')
    @UseGuards(JwtAuthGuard)
    async getMyCoreHistory(@CurrentUser() user: JwtUser): Promise<ApiResponse<UserCoreHistoryDto>> {
        const response = await this.userService.getMyCoreHistory(user.userId);
        return ApiResponse.success(response, HttpStatus.OK);
    }
}