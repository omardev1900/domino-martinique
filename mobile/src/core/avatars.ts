/**
 * Avatar configuration for the application
 * Each avatar has an ID, image source, and display name
 */

// Import all avatar images
export const AVATAR_IMAGES = {
    avatar_01: require('@/assets/images/avatars/player/avatar_01.jpg'),
    avatar_02: require('@/assets/images/avatars/player/avatar_02.jpg'),
    avatar_03: require('@/assets/images/avatars/player/avatar_03.jpg'),
    avatar_04: require('@/assets/images/avatars/player/avatar_04.jpg'),
    avatar_05: require('@/assets/images/avatars/player/avatar_05.jpg'),
    avatar_06: require('@/assets/images/avatars/player/avatar_06.jpg'),
    avatar_07: require('@/assets/images/avatars/player/avatar_07.jpg'),
    avatar_08: require('@/assets/images/avatars/player/avatar_08.jpg'),
    avatar_09: require('@/assets/images/avatars/player/avatar_09.jpg'),
    avatar_10: require('@/assets/images/avatars/player/avatar_10.jpg'),
    avatar_11: require('@/assets/images/avatars/player/avatar_11.jpg'),
    avatar_12: require('@/assets/images/avatars/player/avatar_12.jpg'),
    avatar_13: require('@/assets/images/avatars/player/avatar_13.jpg'),
    avatar_14: require('@/assets/images/avatars/player/avatar_14.jpg'),
    avatar_15: require('@/assets/images/avatars/player/avatar_15.jpg'),
    avatar_16: require('@/assets/images/avatars/player/avatar_16.jpg'),
    avatar_17: require('@/assets/images/avatars/player/avatar_17.jpg'),
    avatar_18: require('@/assets/images/avatars/player/avatar_18.jpg'),
    avatar_default: require('@/assets/images/avatars/default.jpg'),
    Chip_1: require('@/assets/images/avatars/bot/Chip_1.png'),
    Spark_2: require('@/assets/images/avatars/bot/Spark_2.png'),
    Atlas_3: require('@/assets/images/avatars/bot/Atlas_3.png'),
    Zenith_4: require('@/assets/images/avatars/bot/Zenith_4.png'),
} as const;

export type AvatarId = keyof typeof AVATAR_IMAGES;

// List of available avatar IDs for selection
export const AVAILABLE_AVATARS: AvatarId[] = [
    'avatar_01',
    'avatar_02',
    'avatar_03',
    'avatar_04',
    'avatar_05',
    'avatar_06',
    'avatar_07',
    'avatar_08',
    'avatar_09',
    'avatar_10',
    'avatar_11',
    'avatar_12',
    'avatar_13',
    'avatar_14',
    'avatar_15',
    'avatar_16',
    'avatar_17',
    'avatar_18',
];

/**
 * Get the image source for an avatar ID
 */
export const getAvatarImage = (avatarId: string | null | undefined) => {
    if (!avatarId) {
        return AVATAR_IMAGES.avatar_default;
    }

    // Check if the avatarId is actually a remote URL (like Firebase Storage)
    // SEC-9: Whitelist de domaines autorisés pour éviter l'injection d'URLs arbitraires
    const ALLOWED_AVATAR_DOMAINS = [
        'firebasestorage.googleapis.com',
        'lh3.googleusercontent.com', // Google Photos (comptes Google)
    ];

    if (avatarId.startsWith('http://') || avatarId.startsWith('https://')) {
        try {
            const url = new URL(avatarId);
            const hostname = url?.hostname;
            if (hostname && ALLOWED_AVATAR_DOMAINS.some(d => hostname.endsWith(d))) {
                return { uri: avatarId };
            }
        } catch {}
        return AVATAR_IMAGES.avatar_default; // URL invalide ou domaine non autorisé
    }

    if (!(avatarId in AVATAR_IMAGES)) {
        return AVATAR_IMAGES.avatar_default; // Default avatar fallback
    }

    return AVATAR_IMAGES[avatarId as AvatarId];
};
