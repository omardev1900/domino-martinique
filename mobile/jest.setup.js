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
