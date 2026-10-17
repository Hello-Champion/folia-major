import React from 'react';
import { Crosshair } from 'lucide-react';

// src/components/app/playing-song-locator/GridLocateButton.tsx
// "Is the song that is playing on this page": the small round button that stands above a grid's
// action button (GridListSearchButton's `above`). It is lit while the song is one of the cards
// of the page it stands on, so that a glance tells what a press will find.
// A press answers at once with a ring that leaves the button and a mark that turns into place.
// A page that was opened to show the song (the player's "playing from") may still wait for the
// tracks that hold it: rings keep leaving the button for as long as it does.
// The walls (lattice, and the bravais library) carry the same button above their tools button, for their tiles.

interface GridLocateButtonProps {
    isDaylight: boolean;
    accentColor: string;
    /** The playing song is one of this page's cards. */
    isHere: boolean;
    /** The page was asked for the song and has not answered yet. */
    isSeeking: boolean;
    title: string;
    onLocate: () => void;
}

export const GridLocateButton: React.FC<GridLocateButtonProps> = ({ isDaylight, accentColor, isHere, isSeeking, title, onLocate }) => {
    return (
        <button
            type="button"
            data-grid-locate={isHere ? 'here' : 'elsewhere'}
            data-grid-locate-seeking={isSeeking ? 'yes' : 'no'}
            aria-busy={isSeeking}
            title={title}
            aria-label={title}
            onClick={onLocate}
            // It moves with the action button below it: half out of the way on a narrow window, whole on a wide one.
            className={`relative mr-1 flex h-10 w-10 translate-x-1/2 cursor-pointer items-center justify-center rounded-[12px] opacity-60 shadow-lg backdrop-blur-md transition-all duration-300 active:scale-90 group-hover:translate-x-0 group-hover:opacity-100 md:translate-x-0 md:opacity-100 ${isDaylight ? 'bg-white/70 text-zinc-900' : 'bg-black/40 text-white'}`}
        >
            <Crosshair size={18} />
        </button>
    );
};
