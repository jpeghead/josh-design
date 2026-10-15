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
  /** The numbers and names that belong on the cover. Each one is quoted from src/lib/data.ts. */
  proof?: { n: string; label: string }[];
  /** The case study as a story: each beat pairs a sentence from the data with an image from the gallery (by index). */
  beats?: { title: string; body: string; image?: number }[];
};

export const workMedia: Record<string, WorkMedia> = {
  spin: {
    field: "#2b120b",
    proof: [
      { n: "1 → team", label: "first designer to Head of Design" },
      { n: "WWDC 2020", label: "App Clips with Apple, featured at the iOS 14 launch" },
      { n: "Google Maps", label: "find, rent, and reserve from the map" },
      { n: "Acquired", label: "merged into Bird" },
    ],
    beats: [
      { title: "The situation", body: "Spin was scaling shared scooters across cities faster than its design could keep up — no design system, no design team, and a product and brand that didn't match the operation running underneath them.", image: 0 },
      { title: "Build the function from zero", body: "I joined as the first product designer and built the design org from the ground up, growing into Head of Design. The first job was a shared design system so the rider app and the brand could scale across markets without re-deciding everything per city.", image: 4 },
      { title: "Make the first ride effortless", body: "Login and unlock in two taps. The map, the scan, the ride: the three screens most riders ever see, designed for the sidewalk, not the deck.", image: 1 },
      { title: "Ship with Apple and Google", body: "I partnered directly with Apple to ship an App Clips experience, featured at WWDC 2020 alongside the iOS 14 launch, and designed the Google Maps integration that let riders find, rent, and reserve a vehicle straight from the map.", image: 2 },
      { title: "A brand that lived on streets", body: "Photography in the brand color, city illustrations for market launches, a safety quiz you could actually play. The brand had to work on a scooter at thirty feet and on a phone at thirty centimeters.", image: 9 },
      { title: "What happened", body: "I went from solo designer to Head of Design leading the team. The Apple and Google partnerships put Spin in front of millions of new riders. Spin was acquired and merged into Bird." },
    ],
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
    proof: [
      { n: "3.5 → 4.8★", label: "App Store rating, ~200 reviews → 50,000+" },
      { n: "~30%", label: "of revenue from the Android app I designed and shipped" },
      { n: "1M+", label: "users as the product scaled" },
      { n: "Acquired", label: "first designer in, left as Head of Design" },
    ],
    beats: [
      { title: "The situation", body: "Hush was a small, invite-only social-commerce app — beautiful, but underperforming. I came in as the first product designer to own the whole surface: app, brand, and site.", image: 0 },
      { title: "Rebuild the core", body: "I redesigned the core app around the feed, groups, search, and the AskHush community. The App Store rating went from about 3.5 stars across roughly 200 reviews to 4.8 across more than 50,000.", image: 1 },
      { title: "Open a second platform", body: "I designed and shipped the first Android app, opening a new revenue stream that grew to roughly 30% of revenue.", image: 2 },
      { title: "Own the whole surface", body: "Brand and the marketing site alongside the product, as the team scaled past a million users.", image: 3 },
      { title: "What happened", body: "I grew from first designer to Head of Design. The product scaled past 1M+ users. Hush was acquired." },
    ],
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
    proof: [
      { n: "Principal", label: "Product Designer at the leading Flutter studio" },
      { n: "VGV + Google", label: "Flutter design system adopted across teams" },
      { n: "Google I/O 2023", label: "generative-AI card game, demoed on stage" },
      { n: "$1M · $3.4M", label: "contracts and raise the engagement sat inside (context, not my number)" },
    ],
    beats: [
      { title: "The situation", body: "VGV is the market leader for Flutter design and development. As Principal Product Designer I worked across their most visible engagements, including work with Google.", image: 0 },
      { title: "One system for every screen", body: "I designed the Flutter design system adopted across VGV and Google teams: the same components on the studio's own site, its blog, and the client apps built on it, from phone to tablet to watch.", image: 1 },
      { title: "Themed per production", body: "A Flutter show app and its admin: brand colors, cast, showtimes, all editable with a live preview, re-themed for each production.", image: 3 },
      { title: "On stage at I/O", body: "I designed a generative-AI card game demoed at Google I/O 2023, which reached the conference's global audience." },
      { title: "What happened", body: "The design system shipped and was adopted across teams. The I/O 2023 work reached the conference's global audience." },
    ],
    cover: { src: img("XkeyWPpKa0jj7Z975EwsgPgkHCg"), alt: "Three phones on royal blue showing the Very Good Ventures mobile site and blog", aspect: "1 / 1" },
    gallery: [
      { src: img("9vtGAi9uzNeni1YIY1hfdj6lk"), alt: "The Very Good Ventures homepage on an iMac: We're Very Good at Flutter", caption: "verygood.ventures — the studio's own site.", aspect: "4 / 3", span: 2 },
      { src: img("q7PGLtBl14XNmc9ncsnxPXmULUM"), alt: "The Very Good Ventures blog on a tablet", caption: "The blog, on the tablet.", aspect: "4 / 3" },
      { src: img("Yzs7HIPoKaqDiUuyF2lwrrYCoLQ"), alt: "Three phones showing the Very Good Ventures site, blog, and an article", caption: "The same system, on the phone.", aspect: "4 / 3" },
      { src: img("KDfTFMmxKAXExgbvS33Golp168"), alt: "Admin interface for a Flutter show app: brand colors with a live phone preview", caption: "No Guarantees Theatrical Productions — show-app admin, brand colors with a live preview.", aspect: "4 / 3" },
      { src: img("WhOeojpBw94susWJGCIM0ckyfA"), alt: "Cast and creative admin table for a show app, with a phone preview", caption: "Admin for cast, creative, and showtimes.", aspect: "4 / 3" },
      { src: img("3jsKbwyIfMWfkW3f8CbzBn1H9U"), alt: "Three phones fanned on red showing a Broadway show app: showtimes, today, and gallery", caption: "No Guarantees — the show app, themed per production (Bad Cinderella).", aspect: "4 / 3" },
      { src: img("vJ1DLjtkb8TgVsXD7ylsPWmblg"), alt: "A theatre app on two phones: a red splash screen and an account screen", caption: "Splash and account.", aspect: "4 / 3" },
    ],
  },
  saucey: {
    field: "#1a1408",
    cover: {
      src: img("XnMDZ7CNfuJRlYXyMPhTjlUHs"),
      alt: "Marker sketch on paper of order-status, receipt, and map wireframes for the Saucey app, with notes like 'Rate & Tip' and 'Contact the driver'",
      caption: "Where it started: marker wireframes for order status, receipt, and the map.",
      aspect: "615 / 776",
    },
    gallery: [],
  },
  nationbuilder: { field: "#0d1a2a", cover: { src: "", alt: "", aspect: "1 / 1" }, gallery: [] },
  differential: { field: "#141414", cover: { src: "", alt: "", aspect: "1 / 1" }, gallery: [] },
  boneyard: { field: "#101010", cover: { src: "", alt: "", aspect: "1 / 1" }, gallery: [] },
};

/** More screens from contract work, shown without client claims. */
export const moreScreens: MediaItem[] = [
  { src: img("rshomcDKWzmXV5NR863J6tyxRw"), alt: "A vocal-effects editing screen on a phone, teal controls on black", caption: "Auto-Tune — vocal effects on the phone (contract, 2024).", aspect: "1 / 1" },
  { src: img("1QJ8b1heLYKmfftGtf5RmGoazU"), alt: "A business-finance app showing revenue and credit scores, purple", caption: "Nav — revenue and business credit at a glance.", aspect: "1 / 1" },
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
