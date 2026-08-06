export class UserBadgeDto {
    code!:          string;
    name!:          string;
    earnedAt!:      Date;
    isFeatured!:    boolean;
    featuredOrder!: number | null;
}

export class UserBadgeListResponseDto {
    badges!: UserBadgeDto[];
}

export class PublicBadgeItem {
    code!:     string;
    name!:     string;
    earnedAt!: Date;
}

export class PublicBadgeListResponseDto {
    badges!: PublicBadgeItem[];
}
