import { Controller, Delete, Get, HttpStatus, Post, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { ApiResponse } from "src/common/dto/api-response";
import type { JwtUser } from "src/common/types/jwt-user.type";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import type { UserCoreDto } from "./dto/user-core.dto";
import type { UserCoreByLanguageDto } from "./dto/user-core-by-language.dto";
import type { UserCoreHistoryDto } from "./dto/user-core-history.dto";
import type { UserProfileDto } from "./dto/user-profile.dto";
import type { UserStreakDto } from "./dto/user-streak.dto";
import type { UserWpmHistoryDto } from "./dto/user-wpm-history.dto";
import { UserService } from "./user.service";
import type { ImageFile } from "src/common/storage/r2.service";

@Controller('/api/user')
export class UserController {
    constructor(
        private readonly userService: UserService,
    ) {}

    // ─── 프로필 ────────────────────────────────────────────────────────────────

    @Get('/me')
    @UseGuards(JwtAuthGuard)
    async getMeProfile(@CurrentUser() user: JwtUser): Promise<ApiResponse<UserProfileDto>> {
        const response = await this.userService.getMeProfile(user.userId);
        return ApiResponse.success(response, HttpStatus.OK);
    }

    @Post('/me/profile')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    async uploadProfileImage(
        @CurrentUser() user: JwtUser,
        @UploadedFile() file: ImageFile,
    ): Promise<ApiResponse<{ profileUrl: string }>> {
        const response = await this.userService.uploadProfileImage(user.userId, file);
        return ApiResponse.success(response, HttpStatus.OK);
    }

    @Delete('/me/profile')
    @UseGuards(JwtAuthGuard)
    async deleteProfileImage(@CurrentUser() user: JwtUser): Promise<ApiResponse<null>> {
        await this.userService.deleteProfileImage(user.userId);
        return ApiResponse.success(null, HttpStatus.OK);
    }

    @Post('/me/banner')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    async uploadBannerImage(
        @CurrentUser() user: JwtUser,
        @UploadedFile() file: ImageFile,
    ): Promise<ApiResponse<{ bannerUrl: string }>> {
        const response = await this.userService.uploadBannerImage(user.userId, file);
        return ApiResponse.success(response, HttpStatus.OK);
    }

    @Delete('/me/banner')
    @UseGuards(JwtAuthGuard)
    async deleteBannerImage(@CurrentUser() user: JwtUser): Promise<ApiResponse<null>> {
        await this.userService.deleteBannerImage(user.userId);
        return ApiResponse.success(null, HttpStatus.OK);
    }

    // ─── Streak ───────────────────────────────────────────────────────────────

    @Get('/me/streak')
    @UseGuards(JwtAuthGuard)
    async getMeStreak(
        @CurrentUser() user: JwtUser,
        @Query('year') year?: string,
        @Query('type') type?: string,
    ): Promise<ApiResponse<UserStreakDto>> {
        const response = await this.userService.getMeStreak(
            user.userId,
            year ? Number(year) : undefined,
            type,
        );
        return ApiResponse.success(response, HttpStatus.OK);
    }

    // ─── WPM 추이 ─────────────────────────────────────────────────────────────

    @Get('/me/wpm/history')
    @UseGuards(JwtAuthGuard)
    async getMeWpmHistory(@CurrentUser() user: JwtUser): Promise<ApiResponse<UserWpmHistoryDto>> {
        const response = await this.userService.getMeWpmHistory(user.userId);
        return ApiResponse.success(response, HttpStatus.OK);
    }

    // ─── CORE ─────────────────────────────────────────────────────────────────

    @Get('/me/core')
    @UseGuards(JwtAuthGuard)
    async getMyCoreInfo(@CurrentUser() user: JwtUser): Promise<ApiResponse<UserCoreDto>> {
        const response = await this.userService.getMyCoreInfo(user.userId);
        return ApiResponse.success(response, HttpStatus.OK);
    }

    @Get('/me/core/by-language')
    @UseGuards(JwtAuthGuard)
    async getMyCoreByLanguage(@CurrentUser() user: JwtUser): Promise<ApiResponse<UserCoreByLanguageDto>> {
        const response = await this.userService.getMyCoreByLanguage(user.userId);
        return ApiResponse.success(response, HttpStatus.OK);
    }

    @Get('/me/core/history')
    @UseGuards(JwtAuthGuard)
    async getMyCoreHistory(@CurrentUser() user: JwtUser): Promise<ApiResponse<UserCoreHistoryDto>> {
        const response = await this.userService.getMyCoreHistory(user.userId);
        return ApiResponse.success(response, HttpStatus.OK);
    }
}
