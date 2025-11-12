declare module 'youtube-player' {
  export interface YouTubePlayer {
    on(event: string, callback: (event: any) => void): void;
    loadVideoById(videoId: string): Promise<void>;
    playVideo(): Promise<void>;
    pauseVideo(): Promise<void>;
    stopVideo(): Promise<void>;
    seekTo(seconds: number, allowSeekAhead: boolean): Promise<void>;
    setVolume(volume: number): Promise<void>;
    mute(): Promise<void>;
    unMute(): Promise<void>;
    getDuration(): Promise<number>;
    getCurrentTime(): Promise<number>;
    getPlayerState(): Promise<number>;
  }

  export interface PlayerOptions {
    height?: string;
    width?: string;
    playerVars?: {
      autoplay?: number;
      controls?: number;
    };
  }

  function YouTubePlayerFactory(
    element: HTMLElement | string,
    options?: PlayerOptions
  ): YouTubePlayer;

  export default YouTubePlayerFactory;
}
