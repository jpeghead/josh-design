/**
 * Presentation layer for the work: the color field each project brings to
 * the page, its cover image, and the gallery shown on its case study.
 * Facts live in src/lib/data.ts; this file only says what to look at.
 *
 * All imagery is Josh's own, from the previous site's export. Web-sized
 * copies live in public/img (made by scripts/optimize-images.mjs from
 * public/framer/canvas/images). Captions state only what is known.
 */

const img = (id: string) => `/img/${id}.jpg`;

export type MediaItem = { src: string; alt: string; caption?: string; aspect: string; span?: 1 | 2 };

export type WorkMedia = {
  /** The muted field behind the project's chapter. */
  field: string;
  cover: MediaItem;
  gallery: MediaItem[];
};

export const workMedia: Record<string, WorkMedia> = {
  spin: {
    field: "#2b120b",
    cover: { src: img("lUfbKLTE61YByqT1TJBRTeMjA"), alt: "Three phones showing the Spin rider app: the map, scanning a scooter's QR code, and an active ride", aspect: "1 / 1" },
    gallery: [
      { src: img("RAOF0jiw87qsIU7GR1OeKHsHEs"), alt: "A rider in a helmet with an orange Spin scooter on a city sidewalk", caption: "Designed for the sidewalk, not the deck.", aspect: "3 / 2", span: 2 },
      { src: img("nHRyfy2tUvYwxZNNpVJcrHT4"), alt: "A phone showing the Spin map and Ride button, held in a tangle of orange cord", caption: "One button: Ride.", aspect: "1 / 1" },
      { src: img("62z0UPLuZ8USfooFprh1sA61c"), alt: "Spin App Clip code on black: hold phone here to ride", caption: "App Clips with Apple — featured at WWDC 2020.", aspect: "1 / 1" },
      { src: img("4LV7mLlLuWzZMNSwAtiLfDG14DA"), alt: "Two phones: logging in with a phone number, and scanning a QR code to start a ride", caption: "Login and unlock in two taps.", aspect: "1 / 1" },
      { src: img("wT2V3ildNmIWTAJ5k9poe81lt00"), alt: "A tablet showing the Spin fleet and a vehicle display reading 05 mph", caption: "The fleet, the hardware display, the system.", aspect: "1 / 1" },
      { src: img("lKFKcMxzaK7uzVlxmTYIzIZE"), alt: "A rider in an orange coat fastening her helmet beside a Spin scooter at golden hour", caption: "Brand photography, in the brand color.", aspect: "2 / 3" },
      { src: img("P8tPvWYdRcsYtaIgXsI1bOhvcd4"), alt: "An orange and black Spin scooter on a red field", caption: "The vehicle.", aspect: "1 / 1" },
      { src: img("drPyB0qigdiXyCjHkK3HdKQsuE"), alt: "Three phones showing the Spin Safety Quiz: Good vs Bad Scooter", caption: "Ride Smart — safety, made playable.", aspect: "1 / 1" },
      { src: img("UToBpLqQOdMFke1gQ7HzL4qm8M0"), alt: "Three phones: the side menu, a profile, and a wallet with Apple Pay", caption: "Menu, profile, wallet.", aspect: "1 / 1" },
      { src: img("dfn3alReQJURMPxR7mNmS0LoM4"), alt: "Two riders on orange Spin scooters down a palm-lined street", caption: "A brand that lived on streets.", aspect: "3 / 2", span: 2 },
      { src: img("0MXXfQ35nAemFdlfC6KNhXGz5U"), alt: "A MacBook suspended by orange cords showing the Spin next-generation vehicle page", caption: "spin.app — the marketing site.", aspect: "1 / 1" },
      { src: img("I8Il1jDtk4uQreDjlIBqV6WGbM"), alt: "Two phones on blue: add a payment method, and a precise-location prompt", caption: "Payment and permissions, without the friction.", aspect: "1 / 1" },
      { src: img("Rv3U4Zf1o002fbIsCcSZgNAEQU"), alt: "Illustrated city skyline with a Spin rider", caption: "City illustrations for market launches.", aspect: "4 / 1", span: 2 },
    ],
  },
  hush: {
    field: "#102228",
    cover: { src: img("5cJXB2K0a0x0saiEPXKHTDIOMrw"), alt: "A 3D cartoon hand swiping up on a phone showing a Hush skincare post", aspect: "1 / 1" },
    gallery: [
      { src: img("8KdHvInqZMe1IcOe6TYyJPbCQ"), alt: "A 3D hand balancing a spinning phone showing the Hush groups feed", caption: "Groups — the feed, rebuilt.", aspect: "1 / 1" },
      { src: img("OxzxoT8IlWghgj9D7nBJwIhu0"), alt: "A 3D hand holding a phone showing Hush beauty search results and rooms", caption: "Search and rooms.", aspect: "1 / 1" },
      { src: img("OLzWmOTv8YOF5MD6hOdsCk4Y2g"), alt: "A 3D hand gripping a phone showing the AskHush community with a share sheet", caption: "AskHush — the community, and sharing out.", aspect: "1 / 1" },
      { src: img("EAZ8NZlpwmH8ceMsPNG6tm9ATY4"), alt: "A 3D hand holding a phone sideways showing the Hush chats list", caption: "Chats.", aspect: "1 / 1" },
    ],
  },
  vgv: {
    field: "#0b1538",
    cover: { src: img("XkeyWPpKa0jj7Z975EwsgPgkHCg"), alt: "Three phones on royal blue showing the Very Good Ventures mobile site and blog", aspect: "1 / 1" },
    gallery: [
      { src: img("9vtGAi9uzNeni1YIY1hfdj6lk"), alt: "The Very Good Ventures homepage on an iMac: We're Very Good at Flutter", caption: "verygood.ventures — the studio's own site.", aspect: "4 / 3", span: 2 },
      { src: img("q7PGLtBl14XNmc9ncsnxPXmULUM"), alt: "The Very Good Ventures blog on a tablet", caption: "The blog, on the tablet.", aspect: "4 / 3" },
      { src: img("Yzs7HIPoKaqDiUuyF2lwrrYCoLQ"), alt: "Three phones showing the Very Good Ventures site, blog, and an article", caption: "The same system, on the phone.", aspect: "4 / 3" },
      { src: img("KDfTFMmxKAXExgbvS33Golp168"), alt: "Admin interface for a Flutter show app: brand colors with a live phone preview", caption: "A Flutter show app — brand colors with a live preview.", aspect: "4 / 3" },
      { src: img("WhOeojpBw94susWJGCIM0ckyfA"), alt: "Cast and creative admin table for a show app, with a phone preview", caption: "Admin for cast, creative, and showtimes.", aspect: "4 / 3" },
      { src: img("3jsKbwyIfMWfkW3f8CbzBn1H9U"), alt: "Three phones fanned on red showing a Broadway show app: showtimes, today, and gallery", caption: "The show app, themed per production.", aspect: "4 / 3" },
      { src: img("vJ1DLjtkb8TgVsXD7ylsPWmblg"), alt: "A theatre app on two phones: a red splash screen and an account screen", caption: "Splash and account.", aspect: "4 / 3" },
    ],
  },
  saucey: { field: "#1a1408", cover: { src: "", alt: "", aspect: "1 / 1" }, gallery: [] },
  nationbuilder: { field: "#0d1a2a", cover: { src: "", alt: "", aspect: "1 / 1" }, gallery: [] },
  differential: { field: "#141414", cover: { src: "", alt: "", aspect: "1 / 1" }, gallery: [] },
  boneyard: { field: "#101010", cover: { src: "", alt: "", aspect: "1 / 1" }, gallery: [] },
};

/** More screens from contract work, shown without client claims. */
export const moreScreens: MediaItem[] = [
  { src: img("rshomcDKWzmXV5NR863J6tyxRw"), alt: "A vocal-effects editing screen on a phone, teal controls on black", caption: "Auto-Tune — vocal effects on the phone (contract, 2024).", aspect: "1 / 1" },
  { src: img("1QJ8b1heLYKmfftGtf5RmGoazU"), alt: "A business-finance app showing revenue and credit scores, purple", caption: "Fintech — revenue and credit at a glance.", aspect: "1 / 1" },
];

/** The life, in photographs. */
export const story = {
  kid: { src: img("aXaAP1v4rnGLSTc80gqrymXOsUU"), alt: "Josh as a small boy in a school photo, blue sweater, big smile", aspect: "1 / 1" },
  montage: { src: "/framer/canvas/video/TTEZQBrp2KRP4nPshC40gKTJGj0.mp4", poster: img("aXaAP1v4rnGLSTc80gqrymXOsUU"), aspect: "1534 / 1824" },
  marine: { src: img("NL2QLFtqWECtyym1vEYtKiY1Og"), alt: "Josh in Marine Corps service uniform", aspect: "3 / 4" },
  osprey: { src: img("W7mPsHzBhoFAxqcUyTxEIghG10c"), alt: "Looking straight up at an MV-22 Osprey as five Marines hang from a single rope beneath it", aspect: "2 / 3" },
  flightline: { src: img("85TV5oMn3SAOrAoRYC5xnTzPE"), alt: "A line of Marines in flight helmets walking down a hazy flightline toward a CH-53 helicopter", aspect: "3 / 2" },
  range: { src: img("sfMnAGTnE16cKd9nm8suW4wk"), alt: "A Marine firing a shotgun on a range, a shell casing mid-air", aspect: "3 / 2" },
  runway: { src: img("DluhClcA3sCumGrShNBFacIIXw"), alt: "Marines running in formation across a flight line at dawn, carrying a unit flag", aspect: "3 / 2" },
  doorway: { src: img("Q1GKBn13eMCRiLOFC6qMIBB0sE"), alt: "A helmeted aircrew member looking out a helicopter door", aspect: "3 / 2" },
  ammo: { src: img("q7gLxMaOgnur6fEmVGGxA67IfZo"), alt: "A Marine pressing an ammo can overhead on a grassy field at dawn", aspect: "3 / 2" },
  crawl: { src: img("x7nySzmhUGYZuxEJD4ek4CNxF0"), alt: "A mud-splattered Marine low-crawling under a rope obstacle at dawn", aspect: "3 / 2" },
  flag: { src: img("mrXrxF7uOpaJ1IK8yYXhE5ggu8"), alt: "A red H&S company flag in the foreground, Marines out of focus behind it", aspect: "3 / 2" },
  convoy: { src: img("ILQgtzAfoB1DMrSNqEKzs19bQ"), alt: "Marines firing a mounted machine gun from the bed of a truck", aspect: "3 / 2" },
};
