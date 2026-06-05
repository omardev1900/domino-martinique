export const initializeAdMob = async () => {
    return Promise.resolve();
};

export const useRewardedAd = (id: string) => ({
    isLoaded: false,
    isClosed: false,
    isEarnedReward: false,
    load: () => {},
    show: () => {}
});

export const useInterstitialAd = (id: string) => ({
    isLoaded: false,
    isClosed: false,
    load: () => {},
    show: () => {}
});

export const TestIds = {
    REWARDED: 'web-rewarded',
    INTERSTITIAL: 'web-interstitial'
};
