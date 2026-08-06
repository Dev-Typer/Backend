export class UserBadgeDto {
    code!:      string;
    name!:      string;
    earnedAt!:  Date;
}

export class UserBadgeListResponseDto {
    badges!: UserBadgeDto[];
}
