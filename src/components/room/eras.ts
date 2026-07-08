/**
 * THE ROOM — era manifest for the static shot.
 *
 * One locked camera; twelve room states from May 22, 1987 to now. Each era
 * slot auto-detects its render at /room/<file> (see ROOM-RENDER-BRIEF.md).
 * Until a render lands, the site shows an intentional dark placeholder that
 * names what the frame will hold.
 */

export type Era = {
  id: string;
  file: string; // /room/<file> — drop-in render
  year: string; // big rolling year readout
  date?: string;
  caption: string;
  sub?: string;
  /** placeholder contents, shown until the render exists */
  holds: string;
};

export const ERAS: Era[] = [
  {
    id: "birth",
    file: "01-1987.jpg",
    year: "1987",
    date: "May 22, 1987",
    caption: "One room. It starts with a crib.",
    sub: "Ohio. Morning light.",
    holds: "A crib in the right corner · a mobile · a rocking chair · morning shaft",
  },
  {
    id: "kid",
    file: "02-1993.jpg",
    year: "1993",
    caption: "A kid who drew all day, every day.",
    sub: "Crayons. A rocket taped to the wall.",
    holds: "Low desk under the window · crayons · taped drawings · toy box · a small figure drawing",
  },
  {
    id: "middleschool",
    file: "03-2001.jpg",
    year: "2001",
    caption: "First computer. The screen starts glowing.",
    holds: "Beige family PC · CRT glow · bunk bed · game posters · glow stars",
  },
  {
    id: "highschool",
    file: "04-2004.jpg",
    year: "2004",
    caption: "Samantha. Junior year.",
    sub: "Two jackets on the chair from here on.",
    holds: "Band posters · skateboard · tower PC · a photo-booth strip taped to the monitor",
  },
  {
    id: "artschool",
    file: "05-2006.jpg",
    year: "2006",
    caption: "Career school, then fine art.",
    sub: "Film, photo, code, music — anything they'd teach.",
    holds: "Drafting table · easel with a figure study · poster tubes · X-Acto · pinned prints",
  },
  {
    id: "corps",
    file: "06-2008.jpg",
    year: "2008",
    caption: "Married in June. Enlisted the same year.",
    sub: "The room goes spartan. A Nikon on the desk.",
    holds: "Rack with hospital corners · footlocker · camis · folded flag · boots · wedding photo",
  },
  {
    id: "gunner",
    file: "07-2009.jpg",
    year: "2009",
    date: "November 1, 2009",
    caption: "Gunner. The crib comes back.",
    sub: "Same corner it started in.",
    holds: "The spartan room + the crib returned to the right corner · mobile · rocking chair",
  },
  {
    id: "la",
    file: "08-2014.jpg",
    year: "2014",
    caption: "Los Angeles. Taught myself to ship.",
    sub: "Saucey · Hush — first designer in, Head of Design out.",
    holds: "Sunburned light · palm shadow · iMac · wireframes pinned in a grid · toddler bed",
  },
  {
    id: "remote",
    file: "09-2019.jpg",
    year: "2019",
    caption: "The work commuted. I didn't.",
    sub: "Spin · WWDC 2020 · VGV · Google I/O.",
    holds: "Standing desk · dual monitors · framed WWDC badge · the Spin scooter · toys",
  },
  {
    id: "nolan",
    file: "10-2021.jpg",
    year: "2021",
    caption: "Nolan. The crib comes back again.",
    sub: "Third time. Same corner.",
    holds: "The crib a third time · toys doubled · a paused design file · chair turned toward the crib",
  },
  {
    id: "move",
    file: "11-2023.jpg",
    year: "2023",
    caption: "We packed the whole life.",
    sub: "Lighter squares where every frame hung.",
    holds: "Boxes · ghost rectangles on the wall · the crib corner empty · the door open",
  },
  {
    id: "home",
    file: "12-2024.jpg",
    year: "Now",
    caption: "Home. Cincinnati. Same desk, same kid.",
    sub: "Boneyard · OLO · Weaver · the books.",
    holds: "Workbench · warm monitor · pegboard with tools and crayon rockets · manuscripts · porch light",
  },
];
