import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
    secret: process.env.JWT_SECRET!,
    accessExpiresSeconds: parseInt(process.env.JWT_ACCESS_EXPIRES_SECONDS ?? '300', 10),
    refreshExpiresSeconds: parseInt(process.env.JWT_REFRESH_EXPIRES_SECONDS ?? '604800', 10),
}));
