import type { CSSProperties } from 'react';
import type { Theme } from '../../../types';
import { settingsTokens } from '../../modal/settings/kit/kitTheme';
import { kitMotionTokens } from '../../modal/settings/kit/motion';

// src/components/panelTab/shell/panelTheme.ts
// The colours of the playing page's panel. It is a glass surface over the playing page, drawn with
// the settings kit's parts, so it sets the kit's colour and motion variables on itself and adds the
// three the kit does not hold: the glass, its shadow and the colour of a liked heart. The text is
// the song theme's, as it was before the panel used the kit.

/**
 * The 1px edge the glass carries inside its shadow. Exported so the player bar's small popovers
 * draw the same line as the panel they sit next to.
 */
export const panelEdgeColor = (isDaylight: boolean) => (
    isDaylight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.09)'
);

/**
 * The variables, for the `style` of the panel's surface. `glass` is the global glass switch: on, the
 * selected mark of the panel's segments turns into the same translucent frosted mark the settings
 * window draws (instead of a solid white one in daylight).
 */
export const panelTokens = (isDaylight: boolean, theme: Theme, reduced: boolean, glass = false): CSSProperties => {
    // The kit's raised colour in the dark is a fixed grey for its own dark window. Here the page
    // shows through the glass, and under a bright page that grey is no lighter than what it lies
    // on. A white veil is that same grey on dark glass and stays lighter on any page.
    // 玻璃开关打开时与设置窗口同一套：半透明底 + 顶部内高光 + 内发光 + 投影（--st-raise-shadow）。
    const raised: Record<string, string> = glass
        ? {
            '--st-raise': isDaylight ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.12)',
            '--st-raise-shadow': 'inset 0 1px 0 rgba(255, 255, 255, 0.45), inset 0 0 2px 1px rgba(255, 255, 255, var(--glass-glow, 0.16)), inset 0 0 10px 4px rgba(255, 255, 255, calc(var(--glass-glow, 0.16) * 0.94)), 0 1px 2px rgba(17, 17, 26, 0.18), 0 2px 8px rgba(17, 17, 26, 0.1)',
        }
        : (isDaylight ? {} : { '--st-raise': 'rgba(255, 255, 255, 0.18)' });
    return {
        '--text-primary': theme.primaryColor,
        ...settingsTokens(isDaylight, theme),
        ...kitMotionTokens(reduced),
        ...raised,
        '--pn-glass': isDaylight ? 'rgba(244, 244, 245, 0.8)' : 'rgba(28, 28, 31, 0.8)',
        '--pn-shadow': isDaylight
            ? `0 30px 80px rgba(0, 0, 0, 0.24), 0 0 0 1px ${panelEdgeColor(true)}`
            : `0 30px 80px rgba(0, 0, 0, 0.55), 0 0 0 1px ${panelEdgeColor(false)}`,
        '--pn-like': isDaylight ? '#e0354f' : '#f2607a',
    } as CSSProperties;
};
