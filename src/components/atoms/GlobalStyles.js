import { createGlobalStyle } from 'styled-components';
import { BULLET_SIZE, FONTS, GRID_UNIT } from './tokens';

export default createGlobalStyle(
    ({ theme }) => `
        * {
            background: unset;
            border: unset;
            box-sizing: border-box;
            color: unset;
            font: unset;
            font-size: inherit;
            line-height: ${FONTS.NORMAL.LINE_HEIGHT};
            list-style-type: none;
            margin: 0;
            outline: unset;
            padding: 0;
        }
        :root {
            background: ${theme.BACKGROUND};
            color: ${theme.TEXT};
            font-family: 'Operator Mono', monospace;
            font-size: ${FONTS.NORMAL.SIZE};
            font-weight: 300;
            height: 100%;
            overflow: hidden;
        }
        strong {
            font-weight: 900;
        }
        em {
            font-style: italic;
        }
        ::placeholder {
            color: ${theme.PRIMARY};
            opacity: 1;
        }
        ::selection {
            color: ${theme.HIGH_CONTRAST_TEXT};
            background-color: ${theme.HIGH_CONTRAST_BACKGROUND};
        }
        
        .markdown {
            * + * {
                margin-top: calc(${GRID_UNIT} * 0.5);
            }
            
            h1 {
                color: ${theme.TEXT_FADED};
                font-size: 1.4rem;
                font-weight: 500;
                border-bottom: 2px dotted ${theme.TEXT_FADED};
                padding-bottom: calc(${GRID_UNIT} * 0.25);
            }
            
            * + h1 {
                margin-top: ${GRID_UNIT};
            }
        
            blockquote {
                border-left: 2px dotted ${theme.TEXT_FADED};
                font-style: italic;
                padding: calc(${GRID_UNIT} * 0.5) ${GRID_UNIT};
            }
        
            li {
                padding-left: ${GRID_UNIT};
                position: relative;
        
                &:before {
                    content: '';
                    box-sizing: border-box;
                    position: absolute;
                    top: 5px;
                    left: 0;
                    border: 2px dotted ${theme.TEXT_FADED};
                    border-radius: 100px;
                    width: ${BULLET_SIZE};
                    height: ${BULLET_SIZE};
                }
            }
        }
    `
);
