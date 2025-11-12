"use client";

import { useState, useEffect, useRef } from "react";
import YouTubePlayer from "youtube-player";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Music,
} from "lucide-react";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
}

export default function Home() {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<any>(null);
  const playerInstanceRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (playerRef.current && !playerInstanceRef.current) {
      playerInstanceRef.current = YouTubePlayer(playerRef.current, {
        height: "0",
        width: "0",
        playerVars: {
          autoplay: 0,
          controls: 0,
        },
      });

      playerInstanceRef.current.on("stateChange", (event: any) => {
        if (event.data === 1) {
          setIsPlaying(true);
          startProgressTracking();
        } else if (event.data === 2) {
          setIsPlaying(false);
          stopProgressTracking();
        } else if (event.data === 0) {
          handleNext();
        }
      });

      playerInstanceRef.current.on("ready", async () => {
        const dur = await playerInstanceRef.current.getDuration();
        setDuration(dur);
      });
    }

    return () => {
      stopProgressTracking();
    };
  }, []);

  const startProgressTracking = () => {
    stopProgressTracking();
    progressIntervalRef.current = setInterval(async () => {
      if (playerInstanceRef.current) {
        const time = await playerInstanceRef.current.getCurrentTime();
        setCurrentTime(time);
      }
    }, 500);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const extractPlaylistId = (url: string) => {
    const match = url.match(/[?&]list=([^&]+)/);
    return match ? match[1] : null;
  };

  const fetchPlaylist = async () => {
    setError("");
    setLoading(true);

    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      setError("Invalid playlist URL");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/playlist?id=${playlistId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch playlist");
      }

      setVideos(data.videos);
      setCurrentIndex(0);
      if (data.videos.length > 0) {
        loadVideo(data.videos[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadVideo = async (videoId: string) => {
    if (playerInstanceRef.current) {
      await playerInstanceRef.current.loadVideoById(videoId);
      const dur = await playerInstanceRef.current.getDuration();
      setDuration(dur);
      setCurrentTime(0);
    }
  };

  const handlePlayPause = async () => {
    if (!playerInstanceRef.current || videos.length === 0) return;

    if (isPlaying) {
      await playerInstanceRef.current.pauseVideo();
    } else {
      await playerInstanceRef.current.playVideo();
    }
  };

  const handleNext = () => {
    if (currentIndex < videos.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      loadVideo(videos[nextIndex].id);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      loadVideo(videos[prevIndex].id);
    }
  };

  const handleVolumeChange = async (newVolume: number) => {
    setVolume(newVolume);
    if (playerInstanceRef.current) {
      await playerInstanceRef.current.setVolume(newVolume);
    }
    if (newVolume > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = async () => {
    if (playerInstanceRef.current) {
      if (isMuted) {
        await playerInstanceRef.current.unMute();
        setIsMuted(false);
      } else {
        await playerInstanceRef.current.mute();
        setIsMuted(true);
      }
    }
  };

  const handleSeek = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (playerInstanceRef.current) {
      await playerInstanceRef.current.seekTo(newTime, true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 flex items-center justify-center gap-3">
            <Music className="w-12 h-12" />
            YouTube Music Player
          </h1>
          <p className="text-blue-200">Enter a YouTube playlist URL to start</p>
        </div>

        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              placeholder="https://www.youtube.com/playlist?list=..."
              className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-white placeholder-white/50"
              onKeyPress={(e) => e.key === "Enter" && fetchPlaylist()}
            />
            <button
              onClick={fetchPlaylist}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              {loading ? "Loading..." : "Load"}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-red-300 text-sm">{error}</p>
          )}
        </div>

        {videos.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 mb-6">
              <div className="mb-6">
                <img
                  src={videos[currentIndex].thumbnail}
                  alt={videos[currentIndex].title}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
                <h2 className="text-2xl font-bold text-center">
                  {videos[currentIndex].title}
                </h2>
                <p className="text-center text-blue-200 mt-1">
                  Track {currentIndex + 1} of {videos.length}
                </p>
              </div>

              <div className="mb-4">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) 100%)`,
                  }}
                />
                <div className="flex justify-between text-sm text-blue-200 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 mb-6">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="p-3 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <SkipBack className="w-8 h-8" />
                </button>
                <button
                  onClick={handlePlayPause}
                  className="p-5 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-10 h-10" />
                  ) : (
                    <Play className="w-10 h-10 ml-1" />
                  )}
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === videos.length - 1}
                  className="p-3 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <SkipForward className="w-8 h-8" />
                </button>
              </div>

              <div className="flex items-center gap-3 justify-center">
                <button onClick={toggleMute} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                  className="w-32 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume}%, rgba(255,255,255,0.2) ${volume}%, rgba(255,255,255,0.2) 100%)`,
                  }}
                />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
              <h3 className="text-xl font-bold mb-4">Playlist</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {videos.map((video, index) => (
                  <div
                    key={video.id}
                    onClick={() => {
                      setCurrentIndex(index);
                      loadVideo(video.id);
                    }}
                    className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${
                      index === currentIndex
                        ? "bg-blue-600"
                        : "hover:bg-white/10"
                    }`}
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-20 h-14 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{video.title}</p>
                      <p className="text-sm text-blue-200">Track {index + 1}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={playerRef} className="hidden"></div>
      </div>
    </div>
  );
}
