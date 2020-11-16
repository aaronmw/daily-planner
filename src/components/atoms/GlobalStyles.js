import { createGlobalStyle } from 'styled-components';
import { BULLET_SIZE, COLORS, GRID_UNIT } from './tokens';

export default createGlobalStyle(
    ({ theme }) => `
        * {
            background: unset;
            border: unset;
            box-sizing: border-box;
            color: unset;
            font: unset;
            font-size: 1rem;
            line-height: 1.4em;
            list-style-type: none;
            margin: 0;
            outline: unset;
            padding: 0;
        }
        :root {
            background: ${COLORS[theme.name].BACKGROUND};
            color: ${COLORS[theme.name].TEXT};
            font-family: 'Operator Mono', monospace;
            font-size: 15px;
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
        
        .markdown {
            * + * {
                margin-top: calc(${GRID_UNIT} * 0.5);
            }
            
            h1 {
                color: ${COLORS[theme.name].TEXT_FADED};
                font-size: 1.4rem;
                font-weight: 500;
                border-bottom: 2px dotted ${COLORS[theme.name].TEXT_FADED};
                padding-bottom: calc(${GRID_UNIT} * 0.25);
                
                & + * {
                    margin-top: ${GRID_UNIT};
                } 
            }
        
            blockquote {
                border-left: 2px dotted ${COLORS[theme.name].TEXT_FADED};
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
                    border: 2px dotted ${COLORS[theme.name].TEXT_FADED};
                    border-radius: 100px;
                    width: ${BULLET_SIZE};
                    height: ${BULLET_SIZE};
                }
            }
        }
    `
);
