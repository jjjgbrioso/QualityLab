/**
 * Destination and city photos used by the travel pages. Product, hotel, and ship photos
 * are stored on their database rows instead, so the API and admin tools can change them.
 * Every file under public/images is listed with its source in documentation/image-credits.md.
 */
const DESTINATION_IMAGES: Record<string, string> = {
  "Philippine Islands": "/images/destinations/philippine-islands.jpg",
  "Southeast Asia": "/images/destinations/southeast-asia.jpg",
  "Hong Kong & Taiwan": "/images/destinations/hong-kong-taiwan.jpg",
  "Japan & Korea": "/images/destinations/japan-korea.jpg",
};

const CITY_IMAGES: Record<string, string> = {
  Amsterdam: "/images/cities/amsterdam.jpg",
  Cebu: "/images/cities/cebu.jpg",
  Kyoto: "/images/cities/kyoto.jpg",
  Lisbon: "/images/cities/lisbon.jpg",
  Palawan: "/images/cities/palawan.jpg",
  Reykjavik: "/images/cities/reykjavik.jpg",
  Singapore: "/images/cities/singapore.jpg",
};

/** Null for a destination without a photo, such as one an admin adds later. */
export function destinationImageUrl(destination: string): string | null {
  return DESTINATION_IMAGES[destination] ?? null;
}

export function cityImageUrl(city: string): string | null {
  return CITY_IMAGES[city] ?? null;
}
