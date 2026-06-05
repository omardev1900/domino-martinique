import mobileAds, { useRewardedAd, useInterstitialAd, TestIds } from 'react-native-google-mobile-ads';

export const initializeAdMob = async () => {
    return mobileAds().initialize();
};

export { useRewardedAd, useInterstitialAd, TestIds };
