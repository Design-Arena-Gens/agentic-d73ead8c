import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const playlistId = searchParams.get("id");

  if (!playlistId) {
    return NextResponse.json(
      { error: "Playlist ID is required" },
      { status: 400 }
    );
  }

  try {
    // Using YouTube's oEmbed API to get basic playlist info
    // For a production app, you would use the YouTube Data API v3 with an API key

    // This is a simplified approach that fetches the playlist page and extracts video IDs
    const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;

    const response = await fetch(playlistUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch playlist");
    }

    const html = await response.text();

    // Extract video IDs from the ytInitialData JSON
    const ytInitialDataMatch = html.match(/var ytInitialData = ({.+?});/);

    if (!ytInitialDataMatch) {
      throw new Error("Could not parse playlist data");
    }

    const ytInitialData = JSON.parse(ytInitialDataMatch[1]);

    // Navigate the YouTube data structure
    const contents =
      ytInitialData?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]
        ?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]
        ?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer
        ?.contents || [];

    const videos = contents
      .filter((item: any) => item.playlistVideoRenderer)
      .map((item: any) => {
        const video = item.playlistVideoRenderer;
        return {
          id: video.videoId,
          title: video.title?.runs?.[0]?.text || "Unknown Title",
          thumbnail:
            video.thumbnail?.thumbnails?.[0]?.url ||
            `https://i.ytimg.com/vi/${video.videoId}/default.jpg`,
        };
      })
      .slice(0, 50); // Limit to 50 videos

    if (videos.length === 0) {
      throw new Error("No videos found in playlist");
    }

    return NextResponse.json({ videos });
  } catch (error: any) {
    console.error("Error fetching playlist:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch playlist" },
      { status: 500 }
    );
  }
}
