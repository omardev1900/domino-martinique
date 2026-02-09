/**
 * Avatar configuration for the application
 * Each avatar has an ID, image source, and display name
 */

// Import all avatar images
export const AVATAR_IMAGES = {
    avatar_01: require('../../assets/images/avatars/avatar_01.jpg'),
    avatar_02: require('../../assets/images/avatars/avatar_02.jpg'),
    avatar_03: require('../../assets/images/avatars/avatar_03.jpg'),
    avatar_04: require('../../assets/images/avatars/avatar_04.jpg'),
    avatar_05: require('../../assets/images/avatars/avatar_05.jpg'),
    avatar_06: require('../../assets/images/avatars/avatar_06.jpg'),
    avatar_07: require('../../assets/images/avatars/avatar_07.jpg'),
    avatar_08: require('../../assets/images/avatars/avatar_08.jpg'),
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
];

/**
 * Get the image source for an avatar ID
 */
export const getAvatarImage = (avatarId: string | null | undefined) => {
    if (!avatarId || !(avatarId in AVATAR_IMAGES)) {
        return AVATAR_IMAGES.avatar_01; // Default avatar
    }
    return AVATAR_IMAGES[avatarId as AvatarId];
};
