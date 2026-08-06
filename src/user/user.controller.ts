import { Controller, Delete, Get, HttpStatus, Param, Post, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { ApiResponse } from "src/common/dto/api-response";
import type { JwtUser } from "src/common/types/jwt-user.type";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import type { UserHoverDto } from "./dto/user-hover.dto";
import type { UserBadgeListResponseDto } from "../badge/dto/user-badge-response.dto";
import type { UserCoreDto } from "./dto/user-core.dto";
import type { UserCoreByLanguageDto } from "./dto/user-core-by-language.dto";
import type { UserCoreHistoryDto } from "./dto/user-core-history.dto";
import type { UserMeResponseDto } from "./dto/user-me-response.dto";
import type { UserStreakDto } from "./dto/user-streak.dto";
import type { CurrentStreakResponseDto } from "./dto/current-streak-response.dto";
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
    async getUserMe(@CurrentUser() user: JwtUser): Promise<ApiResponse<UserMeResponseDto>> {
        const response = await this.userService.getUserMe(user.userId);
        return ApiResponse.success(response, HttpStatus.OK);
    }

    @Post('/me/profile')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    async uploadProfileImage(
        @CurrentUser() user: JwtUser,
        @UploadedFile() file: ImageFile | undefined,
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
        @UploadedFile() file: ImageFile | undefined,
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

    @Get('/me/current-streak')
    @UseGuards(JwtAuthGuard)
    async getCurrentStreak(@CurrentUser() user: JwtUser): Promise<ApiResponse<CurrentStreakResponseDto>> {
        const response = await this.userService.getCurrentStreak(user.userId);
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

    @Get('/me/badges')
    @UseGuards(JwtAuthGuard)
    async getMyBadges(@CurrentUser() user: JwtUser): Promise<ApiResponse<UserBadgeListResponseDto>> {
        const response = await this.userService.getMyBadges(user.userId);
        return ApiResponse.success(response, HttpStatus.OK);
    }

    // ─── 공개 API (인증 불필요 — /me 라우트 이후, :username 와일드카드 이전) ────────

    @Get(':username/hover')
    async getHoverCard(@Param('username') username: string): Promise<ApiResponse<UserHoverDto>> {
        const response = await this.userService.getHoverCard(username);
        return ApiResponse.success(response, HttpStatus.OK);
    }

    @Get(':username/streak')
    async getPublicStreak(
        @Param('username') username: string,
        @Query('year') year?: string,
        @Query('type') type?: string,
    ): Promise<ApiResponse<UserStreakDto>> {
        const response = await this.userService.getPublicStreak(username, year ? Number(year) : undefined, type);
        return ApiResponse.success(response, HttpStatus.OK);
    }

    @Get(':username/wpm/history')
    async getPublicWpmHistory(@Param('username') username: string): Promise<ApiResponse<UserWpmHistoryDto>> {
        const response = await this.userService.getPublicWpmHistory(username);
        return ApiResponse.success(response, HttpStatus.OK);
    }

    @Get(':username/core/by-language')
    async getPublicCoreByLanguage(@Param('username') username: string): Promise<ApiResponse<UserCoreByLanguageDto>> {
        const response = await this.userService.getPublicCoreByLanguage(username);
        return ApiResponse.success(response, HttpStatus.OK);
    }

    @Get(':username/core/history')
    async getPublicCoreHistory(@Param('username') username: string): Promise<ApiResponse<UserCoreHistoryDto>> {
        const response = await this.userService.getPublicCoreHistory(username);
        return ApiResponse.success(response, HttpStatus.OK);
    }

    @Get(':username/core')
    async getPublicCoreInfo(@Param('username') username: string): Promise<ApiResponse<UserCoreDto>> {
        const response = await this.userService.getPublicCoreInfo(username);
        return ApiResponse.success(response, HttpStatus.OK);
    }

    @Get(':username/badges')
    async getPublicBadges(@Param('username') username: string): Promise<ApiResponse<UserBadgeListResponseDto>> {
        const response = await this.userService.getPublicBadges(username);
        return ApiResponse.success(response, HttpStatus.OK);
    }

    @Get(':username')
    async getPublicProfile(@Param('username') username: string): Promise<ApiResponse<UserMeResponseDto>> {
        const response = await this.userService.getPublicProfile(username);
        return ApiResponse.success(response, HttpStatus.OK);
    }
}
