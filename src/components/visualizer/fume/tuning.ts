import { DEFAULT_FUME_TUNING, type FumeTuning } from '../../../types';
import { defineVisualizerTuning, type StoredTuningFields } from '../tuningDefinition';

// src/components/visualizer/fume/tuning.ts
// Fume's tuning: its defaults, the settings store fields it lives in, where it is stored and how
// a stored value and a change are read, and the renderer prop it is put on.

declare module '../tuningDefinition' {
    interface VisualizerTuningSettings extends StoredTuningFields<'fumeTuning', 'handleSetFumeTuning', 'handleResetFumeTuning', FumeTuning> {}
}

/** A finite number kept between `min` and `max`; anything else is the fallback. */
const inRange = (min: number, max: number) => (value: number, fallback: number) => (
    Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback
);

const cameraSpeed = inRange(0.55, 1.85);
const glowIntensity = inRange(0, 1.8);
const backgroundObjectOpacity = inRange(0, 1);
const heroScale = inRange(0.82, 1.32);
const textHoldRatio = inRange(0, 1);
const printStampWidth = inRange(0.4, 2);
const printStampHeight = inRange(0.4, 2);
const printStampOffsetX = inRange(-200, 200);
const printStampOffsetY = inRange(-200, 200);
const printStampOpacity = inRange(0, 1);

/** A hex colour, or '' for follow-the-accent. Anything else is the fallback. */
const printStampColor = (value: string | undefined): string => (
    typeof value === 'string' && (value === '' || /^#[0-9a-fA-F]{6}$/.test(value))
        ? value
        : DEFAULT_FUME_TUNING.printStampColor
);

const cameraTrackingMode = (value: FumeTuning['cameraTrackingMode'] | undefined) => (
    value === 'stepped' || value === 'smooth'
        ? value
        : DEFAULT_FUME_TUNING.cameraTrackingMode
);

export default defineVisualizerTuning<FumeTuning>({
    mode: 'fume',
    defaults: DEFAULT_FUME_TUNING,
    settingsKey: 'fumeTuning',
    settingsSetterKey: 'handleSetFumeTuning',
    settingsResetterKey: 'handleResetFumeTuning',
    storage: {
        key: 'fume_tuning',
        read: (stored: Partial<FumeTuning> & { textHoldStyle?: 'standard' | 'dimmed'; }) => {
            // Before the hold was a ratio it was a style: "dimmed" is the half hold.
            const migratedTextHoldRatio = stored.textHoldStyle === 'dimmed'
                ? 0.5
                : DEFAULT_FUME_TUNING.textHoldRatio;
            return {
                hidePrintSymbols: stored.hidePrintSymbols ?? DEFAULT_FUME_TUNING.hidePrintSymbols,
                disableGeometricBackground: stored.disableGeometricBackground ?? DEFAULT_FUME_TUNING.disableGeometricBackground,
                backgroundObjectOpacity: backgroundObjectOpacity(
                    stored.backgroundObjectOpacity ?? DEFAULT_FUME_TUNING.backgroundObjectOpacity,
                    DEFAULT_FUME_TUNING.backgroundObjectOpacity,
                ),
                textHoldRatio: textHoldRatio(stored.textHoldRatio ?? migratedTextHoldRatio, DEFAULT_FUME_TUNING.textHoldRatio),
                cameraTrackingMode: cameraTrackingMode(stored.cameraTrackingMode),
                cameraSpeed: cameraSpeed(stored.cameraSpeed ?? DEFAULT_FUME_TUNING.cameraSpeed, DEFAULT_FUME_TUNING.cameraSpeed),
                glowIntensity: glowIntensity(stored.glowIntensity ?? DEFAULT_FUME_TUNING.glowIntensity, DEFAULT_FUME_TUNING.glowIntensity),
                heroScale: heroScale(stored.heroScale ?? DEFAULT_FUME_TUNING.heroScale, DEFAULT_FUME_TUNING.heroScale),
                printStampWidth: printStampWidth(stored.printStampWidth ?? DEFAULT_FUME_TUNING.printStampWidth, DEFAULT_FUME_TUNING.printStampWidth),
                printStampHeight: printStampHeight(stored.printStampHeight ?? DEFAULT_FUME_TUNING.printStampHeight, DEFAULT_FUME_TUNING.printStampHeight),
                printStampOffsetX: printStampOffsetX(stored.printStampOffsetX ?? DEFAULT_FUME_TUNING.printStampOffsetX, DEFAULT_FUME_TUNING.printStampOffsetX),
                printStampOffsetY: printStampOffsetY(stored.printStampOffsetY ?? DEFAULT_FUME_TUNING.printStampOffsetY, DEFAULT_FUME_TUNING.printStampOffsetY),
                printStampOpacity: printStampOpacity(stored.printStampOpacity ?? DEFAULT_FUME_TUNING.printStampOpacity, DEFAULT_FUME_TUNING.printStampOpacity),
                printStampColor: printStampColor(stored.printStampColor),
            };
        },
        merge: (held, patch) => ({
            hidePrintSymbols: patch.hidePrintSymbols ?? held.hidePrintSymbols,
            disableGeometricBackground: patch.disableGeometricBackground ?? held.disableGeometricBackground,
            backgroundObjectOpacity: backgroundObjectOpacity(
                patch.backgroundObjectOpacity ?? held.backgroundObjectOpacity,
                held.backgroundObjectOpacity,
            ),
            textHoldRatio: textHoldRatio(patch.textHoldRatio ?? held.textHoldRatio, held.textHoldRatio),
            cameraTrackingMode: cameraTrackingMode(patch.cameraTrackingMode ?? held.cameraTrackingMode),
            cameraSpeed: cameraSpeed(patch.cameraSpeed ?? held.cameraSpeed, held.cameraSpeed),
            glowIntensity: glowIntensity(patch.glowIntensity ?? held.glowIntensity, held.glowIntensity),
            heroScale: heroScale(patch.heroScale ?? held.heroScale, held.heroScale),
            printStampWidth: printStampWidth(patch.printStampWidth ?? held.printStampWidth, held.printStampWidth),
            printStampHeight: printStampHeight(patch.printStampHeight ?? held.printStampHeight, held.printStampHeight),
            printStampOffsetX: printStampOffsetX(patch.printStampOffsetX ?? held.printStampOffsetX, held.printStampOffsetX),
            printStampOffsetY: printStampOffsetY(patch.printStampOffsetY ?? held.printStampOffsetY, held.printStampOffsetY),
            printStampOpacity: printStampOpacity(patch.printStampOpacity ?? held.printStampOpacity, held.printStampOpacity),
            printStampColor: printStampColor(patch.printStampColor ?? held.printStampColor),
        }),
        resetNotice: 'notifications.fumeReset',
    },
    apply: (props, tuning) => ({ ...props, fumeTuning: tuning }),
});
