import { describe, expect, it, vi } from 'vitest';
import { isWallPanning, setWallPanning, subscribeWallPanning } from '../../../src/components/wall/wallPanning';

describe('wallPanning', () => {
    it('tells listeners only when the wall stops, not when it starts', () => {
        const listener = vi.fn();
        const off = subscribeWallPanning(listener);
        setWallPanning(true);
        expect(isWallPanning()).toBe(true);
        expect(listener).not.toHaveBeenCalled();
        setWallPanning(false);
        expect(isWallPanning()).toBe(false);
        expect(listener).toHaveBeenCalledTimes(1);
        off();
    });

    it('stops calling a listener that unsubscribed before the wall stopped', () => {
        const listener = vi.fn();
        subscribeWallPanning(listener)();
        setWallPanning(true);
        setWallPanning(false);
        expect(listener).not.toHaveBeenCalled();
    });

    it('ignores a repeated start or stop', () => {
        const listener = vi.fn();
        const off = subscribeWallPanning(listener);
        setWallPanning(false);
        setWallPanning(true);
        setWallPanning(true);
        setWallPanning(false);
        setWallPanning(false);
        expect(listener).toHaveBeenCalledTimes(1);
        off();
    });
});
