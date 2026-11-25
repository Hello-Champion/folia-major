import { sharedModuleState } from '../../../mods/runtime/sharedModuleState';
// 打包器会把本模块复制进多个 chunk：状态各持一份，读写两边对不上。状态放 globalThis。
const moduleState = sharedModuleState('folia.machiCameraBar', () => ({
    open: false,
    listeners: new Set<() => void>(),
}));
// src/components/visualizer/machi/cameraBar.ts
// 町景的取景控制条开着没有：控制面板里的摄影机按钮和命令面板打开它，播放页上的町景画面（VisualizerMachi，预览里不算）
// 照着显示。离开播放页、播放页的町景画面拆掉时（换了别的歌词样式）收起来，下次回来不会自己冒出来。


const setOpen = (next: boolean) => {
    if (moduleState.open === next) return;
    moduleState.open = next;
    moduleState.listeners.forEach(listener => listener());
};

export const openMachiCameraBar = () => setOpen(true);

export const closeMachiCameraBar = () => setOpen(false);

export const toggleMachiCameraBar = () => setOpen(!moduleState.open);

export const isMachiCameraBarOpen = () => moduleState.open;

export const subscribeMachiCameraBar = (listener: () => void) => {
    moduleState.listeners.add(listener);
    return () => { moduleState.listeners.delete(listener); };
};
