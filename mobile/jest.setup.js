import 'react-native';

const mockBatchedBridge = {
  getConstants: () => ({}),
  getEnums: () => ({}),
};
global.__fbBatchedBridgeConfig = mockBatchedBridge;

jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => {
  const turboModuleRegistry = jest.requireActual('react-native/Libraries/TurboModule/TurboModuleRegistry');
  return {
    ...turboModuleRegistry,
    getEnforcing: (name) => {
      if (name === 'PlatformConstants') {
        return {
          reactNativeVersion: { major: 0, minor: 76, patch: 0 },
          osVersion: '16.0',
          forceTouchAvailable: false,
          interfaceIdiom: 'phone',
          isTesting: true,
        };
      }
      return turboModuleRegistry.getEnforcing(name);
    },
  };
});

jest.mock('expo-audio', () => ({
  useAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    remove: jest.fn()
  })),
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          playAsync: jest.fn(),
          stopAsync: jest.fn(),
          unloadAsync: jest.fn(),
        },
      }),
    },
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  }),
  useLocalSearchParams: () => ({}),
  Link: 'Link',
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

jest.mock('./src/core/services/firebase', () => ({
  db: {},
  auth: { currentUser: null, onAuthStateChanged: jest.fn(), signOut: jest.fn() },
  storage: {},
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  onSnapshot: jest.fn(() => jest.fn()),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  increment: jest.fn((n) => n),
  arrayUnion: jest.fn(),
  arrayRemove: jest.fn(),
  writeBatch: jest.fn(() => ({ set: jest.fn(), update: jest.fn(), delete: jest.fn(), commit: jest.fn() })),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  initializeAuth: jest.fn(),
  getReactNativePersistence: jest.fn(),
  browserLocalPersistence: {},
  onAuthStateChanged: jest.fn(() => jest.fn()),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  deleteUser: jest.fn(),
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(() => jest.fn()),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn(),
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({})),
}));

jest.mock('react-native/Libraries/Utilities/NativePlatformConstantsIOS', () => {
    const constants = {
        forceTouchAvailable: false,
        interfaceIdiom: 'en',
        isTesting: true,
        osVersion: 'ios',
        reactNativeVersion: { major: 0, minor: 76, patch: 0 },
        systemName: 'ios',
    };
    return {
        __esModule: true,
        default: {
            getConstants: () => constants,
        },
        getConstants: () => constants,
    };
});
jest.mock('react-native-google-mobile-ads', () => ({ MobileAds: () => ({ initialize: jest.fn().mockResolvedValue(null), setRequestConfiguration: jest.fn(), }), BannerAd: 'BannerAd', BannerAdSize: { BANNER: 'BANNER', LARGE_BANNER: 'LARGE_BANNER', MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE', FULL_BANNER: 'FULL_BANNER', LEADERBOARD: 'LEADERBOARD', }, TestIds: { BANNER: 'ca-app-pub-3940256099942544/6300978111', INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712', REWARDED: 'ca-app-pub-3940256099942544/5224354917', }, InterstitialAd: { createForAdRequest: jest.fn(() => ({ load: jest.fn(), show: jest.fn(), addAdEventListener: jest.fn(() => jest.fn()), })), }, RewardedAd: { createForAdRequest: jest.fn(() => ({ load: jest.fn(), show: jest.fn(), addAdEventListener: jest.fn(() => jest.fn()), })), }, AdEventType: { LOADED: 'loaded', ERROR: 'error', OPENED: 'opened', CLICKED: 'clicked', CLOSED: 'closed', }, RewardedAdEventType: { LOADED: 'loaded', EARNED_REWARD: 'earned_reward', }, }));
