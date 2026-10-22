import { buildExecuteShortcutIndex, resolveExecuteShortcut } from '../executeShortcuts';
import type { CommandPaletteCommand } from '../types';
import type { CommandPaletteSurface } from './types';

// src/components/command-palette/surfaces/executeModeSurface.ts
// Execute mode: the input is a key buffer, not a search box. As soon as the buffer names exactly
// one registered shortcut the command runs, so nothing here waits for Enter.

// Shortcuts resolve against the commands actually available, so a Linux-only key cannot fire on
// Windows even though the prefix-free check covers the whole registry. The list comes from the
// palette's args, not from commandRegistry: importing the registry here would close a cycle
// (registry → commands → executeModeCommand → this surface) whose bindings are uninitialized
// whenever the registry is not the first module in it to load.
const resolve = (availableCommands: CommandPaletteCommand[], buffer: string) => (
    resolveExecuteShortcut(buildExecuteShortcutIndex(availableCommands), buffer)
);

export const executeModeSurface: CommandPaletteSurface = {
    load: () => import('./ExecuteModeSurfaceView'),
    useLiveQuery: true,
    onQueryChange: ({ availableCommands, query, executeCommand }) => {
        const resolution = resolve(availableCommands, query);
        return resolution.status === 'exact' ? executeCommand(resolution.command) : null;
    },
    // Enter is redundant in execute mode, but pressing it on a complete buffer should still work.
    onSubmit: ({ availableCommands, query, executeCommand }) => {
        const resolution = resolve(availableCommands, query);
        return resolution.status === 'exact' ? executeCommand(resolution.command) : false;
    },
    // Escape clears a half-typed buffer before it closes the palette.
    onEscape: ({ query, setQuery }) => {
        if (!query) {
            return false;
        }
        setQuery('');
        return true;
    },
    mapProps: ({ availableCommands, query, isDaylight, theme }) => {
        const resolution = resolve(availableCommands, query);
        return {
            isDaylight,
            theme,
            buffer: query,
            isInvalid: resolution.status === 'none',
            candidates: resolution.status === 'prefix' ? resolution.candidates : [],
        };
    },
};
