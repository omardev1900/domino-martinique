import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { AdBannerModal } from '../AdBannerModal';

jest.mock('expo-image', () => ({
    Image: (props: any) => {
        const { View } = require('react-native');
        return <View {...props} />;
    },
}));

jest.mock('expo-av', () => ({
    ResizeMode: { CONTAIN: 'contain' },
    Video: (props: any) => {
        const { View } = require('react-native');
        return <View {...props} />;
    },
}));

jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Icon',
}));

jest.mock('../../core/services/ad.service', () => ({
    adService: {
        markAdAsShown: jest.fn().mockResolvedValue(undefined),
    },
}));

describe('AdBannerModal', () => {
    const ad = {
        id: 'ad-1',
        title: 'Pub',
        mediaType: 'IMAGE',
        imageUrl: 'https://example.com/ad.png',
        targetUrl: null,
        active: true,
    } as any;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it('ferme au premier appui sur le bouton X apres le countdown', async () => {
        const onClose = jest.fn();
        const screen = render(<AdBannerModal ad={ad} onClose={onClose} />);

        await act(async () => {
            jest.advanceTimersByTime(10000);
        });

        fireEvent.press(screen.getByTestId('ad-close-button'));

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
