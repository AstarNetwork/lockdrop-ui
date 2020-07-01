export const ThemeColors = {
    darkGrey: '#383838',
    lightGrey: '#999999',
    white: '#ffffff',
    black: '#000000',
    darkBlue: '#2C3E50',
    orange: '#FF5838',
    darkRed: '#5c0f0f',
    blue: '#4C8DFF',
    lightBlue: '#56ccf2',
};

export const ThemeFontFamily = {
    logo: 'sans',
    paragraph: 'not sans',
};

const colors = {
    transparent: 'rgba(0, 0, 0, 0)',
    footerTransparent: 'rgba(0, 0, 0, 0.12)',
    navy: '#1d417f',
    ceruleanBlue: '#102e83',
    blue: '#2179ee',
    lightBlue: '#56ccf2',
    periwinkle: '#D4D3E9',
    teal: '#00FFD1',
    green: '#28D24E',
    crimson: '#DC143C',
    red: '#D22828',
    lightRed: '#ED0257',
    coral: '#ff6759',
    pink: '#FF17E8',
    gold: '#f0b95b',
    yellow: '#FFC700',
    purple: '#7537ef',
    lightPurple: '#56408B',
    darkPurple: 'rgba(10, 7, 82, 0.75)',
    softPurple: '#9795C5',
    white: '#ffffff',
    creamWhite: '#f4f5f7',
    black: '#000000',
    grey: '#333333',
    lightGrey: 'grey',
    softGrey: '#1D1B4D',
    slaty: '#797992',
    lavender: '#e5e5f8',
    rat: '#cecddc',
};

const secondaryColors = {
    grey10: '#f3f4f8',
    grey20: '#e1e5eb',
    grey30: '#c2c6cc',
    grey40: '#9ea2a8',
    grey50: '#686c73',
    grey60: '#30363d',
    blue10: '#ade7ff',
    blue20: '#61bcff',
    blue30: '#2179ee',
    blue40: '#1f4ab4',
    blue50: '#1d2064',
    green10: '#b5ffcb',
    green20: '#5dffa3',
    green30: '#00cc9a',
    green40: '#219a8a',
    green50: '#183f51',
    purple10: '#dec7ff',
    purple20: '#a673ff',
    purple30: '#7537ef',
    purple40: '#4e23b6',
    purple50: '#2d1b64',
    coral10: '#ffc6b3',
    coral20: '#ff8e75',
    coral30: '#ff6759',
    coral40: '#eb312a',
    coral50: '#7b1e30',
    gold10: '#ffedc2',
    gold20: '#ffda8b',
    gold30: '#f0b95b',
    gold40: '#e5a229',
    gold50: '#6a4a24',
};

const breakpoints = ['31.25em', '43.75em', '46.875em'];
const fontSizes = ['1.2rem', '1.4rem', '1.6rem', '1.8rem', '2.4rem', '2.8rem', '3.2rem', '4.0rem', '4.8rem', '6.4rem'];
const space = ['0', '.4rem', '.8rem', '1.2rem', '1.6rem', '2.0rem', '3.2rem', '4.8rem', '6.4rem', '9.6rem'];

const font =
    'Work Sans, sans-serif, -apple-system, BlinkMacSystemFont,"Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans","Droid Sans", "Helvetica Neue";-webkit-font-smoothing: antialiased;-moz-osx-font-smoothing: grayscale;';

export interface StyleClosetTheme {
    breakpoints: string[];
    fontSizes: string[];
    space: string[];
    colors: { [key in keyof typeof colors]: string };
    secondaryColors: { [key in keyof typeof secondaryColors]: string };
    font: string;
}

export const theme: StyleClosetTheme = {
    breakpoints,
    fontSizes,
    space,
    colors,
    secondaryColors,
    font,
};
