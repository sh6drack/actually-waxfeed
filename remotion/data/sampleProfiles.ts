// Mock TASTEID profiles for FREQUENCY promo visualization

export interface TasteProfile {
  id: string;
  username: string;
  avatar: string;
  archetype: {
    id: string;
    name: string;
    icon: string;
  };
  genreVector: Record<string, number>;
  topGenres: string[];
  topArtists: string[];
  adventurenessScore: number;
  polarityScore: number;
  ratingSkew: "harsh" | "balanced" | "lenient";
  reviewCount: number;
  averageRating: number;
}

export const SAMPLE_PROFILES: TasteProfile[] = [
  {
    id: "user1",
    username: "vinylhead",
    avatar: "https://i.pravatar.cc/150?u=vinylhead",
    archetype: {
      id: "hip-hop-head",
      name: "Hip-Hop Head",
      icon: "mic",
    },
    genreVector: {
      "hip-hop": 0.92,
      "r&b": 0.75,
      "jazz": 0.55,
      "soul": 0.68,
      "electronic": 0.35,
      "rock": 0.22,
    },
    topGenres: ["hip-hop", "r&b", "soul", "jazz", "neo-soul"],
    topArtists: ["Kendrick Lamar", "Frank Ocean", "Tyler, The Creator", "SZA", "Anderson .Paak"],
    adventurenessScore: 0.68,
    polarityScore: 0.82,
    ratingSkew: "balanced",
    reviewCount: 147,
    averageRating: 7.3,
  },
  {
    id: "user2",
    username: "electronica",
    avatar: "https://i.pravatar.cc/150?u=electronica",
    archetype: {
      id: "electronic-pioneer",
      name: "Electronic Pioneer",
      icon: "zap",
    },
    genreVector: {
      "electronic": 0.95,
      "house": 0.85,
      "techno": 0.78,
      "ambient": 0.62,
      "hip-hop": 0.45,
      "jazz": 0.38,
    },
    topGenres: ["electronic", "house", "techno", "ambient", "uk garage"],
    topArtists: ["Daft Punk", "Jamie xx", "Four Tet", "Kaytranada", "Disclosure"],
    adventurenessScore: 0.85,
    polarityScore: 0.71,
    ratingSkew: "lenient",
    reviewCount: 203,
    averageRating: 7.8,
  },
  {
    id: "user3",
    username: "jazzcat",
    avatar: "https://i.pravatar.cc/150?u=jazzcat",
    archetype: {
      id: "jazz-explorer",
      name: "Jazz Explorer",
      icon: "music",
    },
    genreVector: {
      "jazz": 0.98,
      "soul": 0.72,
      "r&b": 0.55,
      "classical": 0.48,
      "hip-hop": 0.42,
      "electronic": 0.25,
    },
    topGenres: ["jazz", "modal jazz", "spiritual jazz", "bebop", "cool jazz"],
    topArtists: ["Miles Davis", "John Coltrane", "Herbie Hancock", "Kamasi Washington", "Robert Glasper"],
    adventurenessScore: 0.45,
    polarityScore: 0.92,
    ratingSkew: "harsh",
    reviewCount: 312,
    averageRating: 6.8,
  },
  {
    id: "user4",
    username: "artrocker",
    avatar: "https://i.pravatar.cc/150?u=artrocker",
    archetype: {
      id: "art-rock-devotee",
      name: "Art Rock Devotee",
      icon: "radio",
    },
    genreVector: {
      "rock": 0.88,
      "alternative": 0.82,
      "electronic": 0.55,
      "shoegaze": 0.72,
      "post-punk": 0.65,
      "jazz": 0.35,
    },
    topGenres: ["alternative rock", "art rock", "shoegaze", "post-punk", "indie rock"],
    topArtists: ["Radiohead", "My Bloody Valentine", "Björk", "Arcade Fire", "Talking Heads"],
    adventurenessScore: 0.78,
    polarityScore: 0.75,
    ratingSkew: "balanced",
    reviewCount: 256,
    averageRating: 7.1,
  },
  {
    id: "user5",
    username: "soulseeker",
    avatar: "https://i.pravatar.cc/150?u=soulseeker",
    archetype: {
      id: "soul-seeker",
      name: "Soul Seeker",
      icon: "heart",
    },
    genreVector: {
      "r&b": 0.92,
      "soul": 0.88,
      "hip-hop": 0.65,
      "jazz": 0.52,
      "pop": 0.45,
      "electronic": 0.32,
    },
    topGenres: ["r&b", "neo-soul", "soul", "hip-hop", "jazz"],
    topArtists: ["Frank Ocean", "SZA", "Erykah Badu", "D'Angelo", "Solange"],
    adventurenessScore: 0.52,
    polarityScore: 0.68,
    ratingSkew: "lenient",
    reviewCount: 189,
    averageRating: 7.9,
  },
  {
    id: "user6",
    username: "genrefluid",
    avatar: "https://i.pravatar.cc/150?u=genrefluid",
    archetype: {
      id: "genre-fluid",
      name: "Genre Fluid",
      icon: "shuffle",
    },
    genreVector: {
      "electronic": 0.72,
      "hip-hop": 0.68,
      "rock": 0.65,
      "jazz": 0.62,
      "pop": 0.58,
      "r&b": 0.55,
    },
    topGenres: ["electronic", "hip-hop", "rock", "jazz", "pop"],
    topArtists: ["Kendrick Lamar", "Radiohead", "Frank Ocean", "Daft Punk", "Miles Davis"],
    adventurenessScore: 0.95,
    polarityScore: 0.45,
    ratingSkew: "balanced",
    reviewCount: 423,
    averageRating: 7.2,
  },
];

// Pre-computed compatibility for the match scene
export const COMPATIBILITY_PAIR = {
  user1: SAMPLE_PROFILES[0], // vinylhead (hip-hop-head)
  user2: SAMPLE_PROFILES[4], // soulseeker (soul-seeker)
  overallScore: 87,
  matchType: "taste_twin" as const,
  genreOverlap: 82,
  artistOverlap: 65,
  ratingAlignment: 91,
  sharedGenres: ["r&b", "hip-hop", "soul", "jazz", "neo-soul"],
  sharedArtists: ["Frank Ocean", "SZA"],
};

// Sample review snippets for ecosystem scene
export const SAMPLE_REVIEWS = [
  {
    id: "r1",
    text: "This album changed how I hear music. Every track is a journey.",
    rating: 9.5,
    username: "vinylhead",
    album: "To Pimp a Butterfly",
  },
  {
    id: "r2",
    text: "Pure sonic innovation. Nothing else sounds like this.",
    rating: 9.0,
    username: "electronica",
    album: "Random Access Memories",
  },
  {
    id: "r3",
    text: "The production is immaculate. A modern classic.",
    rating: 8.8,
    username: "soulseeker",
    album: "Blonde",
  },
  {
    id: "r4",
    text: "Ahead of its time. Still discovering new layers.",
    rating: 9.2,
    username: "artrocker",
    album: "OK Computer",
  },
];
