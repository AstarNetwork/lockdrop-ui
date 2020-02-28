import { createGlobalStyle } from 'styled-components';
import { generateMedia } from 'styled-media-query';
import { theme } from './themes';

export const customMedia = generateMedia({
    desktop: '1296px',
    laptop: '1172px',
    laptopSmall: '1032px',
    tabletPro: '920px',
    tablet: '768px',
    tabletSmall: '700px',
    mobile: '652px',
});

export const GlobalStyle = createGlobalStyle`

* {
  box-sizing: border-box;
}

/* Memo: To make footer attached to the bottom  */
/* Need to define 'flex: 1;' in the div above the footer  */
#root {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Memo: Remove scrollbar space */
/* https://stackoverflow.com/questions/16670931/hide-scroll-bar-but-while-still-being-able-to-scroll */
::-webkit-scrollbar {
    width: 0px;
}

body {
  background-color: ${theme.colors.creamWhite};
  color: ${theme.colors.black};
  position: relative;
  margin: 0;
  font-style: normal;
  height: 100%;
}
`;
