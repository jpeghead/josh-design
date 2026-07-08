/**
 * THE ROOM — scene composition. Eight rooms along one continuous wall,
 * dark passages between. Camera pans right as the life advances.
 */

import {
  type Ctx,
  P,
  FLOOR_Y,
  window_,
  lamp,
  desk,
  chairSimple,
  crt,
  flatMonitor,
  poster,
  taped,
  easel,
  bedRack,
  footlocker,
  camis,
  flag,
  boxes,
  scooter,
  pegboard,
  crib,
  doorway,
  lightShaft,
  figKidDrawing,
  figTeenSitting,
  figMarine,
  figAdultSitting,
  figWoman,
  figWomanWithBaby,
  figToddler,
  figCarryingBox,
} from "./rooms";

export type Room = {
  id: string;
  x: number; // world-x of the room's left wall
  w: number;
  draw: (g: Ctx, x: number) => void;
};

const RW = 1500; // standard room width
const GAP = 240; // dark passage between rooms

export const ROOMS: Room[] = [
  {
    id: "childhood",
    x: 0,
    w: RW,
    draw(g, x) {
      window_(g, x + 180, 220, 200, 240, 0.7);
      taped(g, x + 640, 260, 70, 54); // the rocket drawing
      taped(g, x + 730, 300, 54, 44);
      taped(g, x + 590, 340, 44, 56);
      desk(g, x + 560, 260, "small");
      lamp(g, x + 780, FLOOR_Y - 64, 1);
      // crayons scattered
      for (let i = 0; i < 5; i++) {
        g.fillStyle = P.silhouette;
        g.fillRect(x + 880 + i * 22, FLOOR_Y - 6, 14, 4);
      }
      figKidDrawing(g, x + 660);
      // toybox
      g.fillStyle = "#10161b";
      g.fillRect(x + 1080, FLOOR_Y - 60, 120, 60);
    },
  },
  {
    id: "highschool",
    x: RW + GAP,
    w: RW,
    draw(g, x) {
      window_(g, x + 150, 200, 190, 250, 0.55);
      poster(g, x + 560, 200, 90, 120);
      poster(g, x + 680, 240, 70, 96);
      poster(g, x + 980, 210, 84, 110);
      desk(g, x + 560, 300, "mid");
      crt(g, x + 640, FLOOR_Y - 86, 1);
      chairSimple(g, x + 560);
      figTeenSitting(g, x + 590);
      // skateboard against the wall
      g.fillStyle = P.silhouette;
      g.fillRect(x + 440, FLOOR_Y - 96, 12, 96);
      // Samantha — junior year; she sits on the bed edge, and stays in the story
      bedRack(g, x + 1050, 260);
      figWoman(g, x + 1130, "bun");
    },
  },
  {
    id: "artschool",
    x: (RW + GAP) * 2,
    w: RW,
    draw(g, x) {
      window_(g, x + 200, 180, 240, 280, 0.75);
      easel(g, x + 620);
      desk(g, x + 820, 300, "mid");
      lamp(g, x + 1020, FLOOR_Y - 78, 1);
      // poster tubes leaning
      g.strokeStyle = P.silhouette;
      g.lineWidth = 8;
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.moveTo(x + 490 + i * 16, FLOOR_Y);
        g.lineTo(x + 520 + i * 16, FLOOR_Y - 150);
        g.stroke();
      }
      figTeenSitting(g, x + 860);
      taped(g, x + 900, 250, 60, 80);
      taped(g, x + 980, 280, 70, 50);
    },
  },
  {
    id: "corps",
    x: (RW + GAP) * 3,
    w: RW + 400, // the long room — five years
    draw(g, x) {
      // higher, barred window; colder light
      window_(g, x + 160, 180, 140, 160, 0.9);
      flag(g, x + 560, 220);
      camis(g, x + 760);
      bedRack(g, x + 380, 280);
      footlocker(g, x + 700);
      desk(g, x + 950, 260, "mid");
      // the camera on the desk
      g.fillStyle = P.silhouette;
      g.fillRect(x + 1030, FLOOR_Y - 100, 44, 24);
      g.beginPath();
      g.arc(x + 1052, FLOOR_Y - 88, 9, 0, Math.PI * 2);
      g.fill();
      figMarine(g, x + 880);
      // late in the room: the family begins
      crib(g, x + 1500);
      figWomanWithBaby(g, x + 1640);
      lamp(g, x + 1420, FLOOR_Y - 70, 0.8);
    },
  },
  {
    id: "la",
    x: (RW + GAP) * 4 + 400,
    w: RW,
    draw(g, x) {
      // wide window, palm silhouettes
      window_(g, x + 140, 190, 300, 260, 0.65);
      g.strokeStyle = "#0e1418";
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(x + 250, 440);
      g.lineTo(x + 260, 330);
      g.stroke();
      g.fillStyle = "#0e1418";
      for (let i = 0; i < 5; i++) {
        g.beginPath();
        g.ellipse(x + 262, 326, 40, 8, (i / 5) * Math.PI - 0.4, 0, Math.PI * 2);
        g.fill();
      }
      desk(g, x + 620, 320, "modern");
      flatMonitor(g, x + 700, FLOOR_Y - 86, 88, 1);
      chairSimple(g, x + 600);
      figAdultSitting(g, x + 640);
      // wireframes pinned
      taped(g, x + 900, 240, 54, 84);
      taped(g, x + 968, 250, 54, 84);
      taped(g, x + 1036, 244, 54, 84);
      // couch + Samantha
      g.fillStyle = "#10161b";
      g.fillRect(x + 1140, FLOOR_Y - 70, 200, 70);
      g.fillRect(x + 1140, FLOOR_Y - 110, 24, 40);
      figWoman(g, x + 1260, "bun");
    },
  },
  {
    id: "remote",
    x: (RW + GAP) * 5 + 400,
    w: RW + 200,
    draw(g, x) {
      window_(g, x + 170, 180, 260, 280, 0.6);
      desk(g, x + 560, 380, "modern");
      flatMonitor(g, x + 620, FLOOR_Y - 86, 84, 1);
      flatMonitor(g, x + 730, FLOOR_Y - 86, 84, 1);
      chairSimple(g, x + 540);
      figAdultSitting(g, x + 580);
      // WWDC badge framed
      poster(g, x + 1000, 230, 54, 66);
      g.fillStyle = `rgba(${P.screen},0.25)`;
      g.fillRect(x + 1004, 236, 46, 54);
      // the scooter in the corner
      scooter(g, x + 1120);
      // kids
      figToddler(g, x + 900);
      crib(g, x + 1320);
      lamp(g, x + 1450, FLOOR_Y - 70, 1);
      // toys
      g.fillStyle = P.silhouette;
      g.fillRect(x + 960, FLOOR_Y - 10, 16, 10);
      g.beginPath();
      g.arc(x + 1000, FLOOR_Y - 8, 8, 0, Math.PI * 2);
      g.fill();
    },
  },
  {
    id: "moving",
    x: (RW + GAP) * 6 + 600,
    w: RW,
    draw(g, x) {
      window_(g, x + 180, 200, 220, 260, 0.5);
      // ghosts where the frames hung
      poster(g, x + 620, 220, 84, 110, true);
      poster(g, x + 740, 250, 60, 84, true);
      poster(g, x + 980, 230, 74, 96, true);
      boxes(g, x + 560, 5);
      boxes(g, x + 900, 3);
      // the family, carrying the life toward the door
      figCarryingBox(g, x + 780, 1);
      figWoman(g, x + 860, "bun");
      figCarryingBox(g, x + 1080, 0.62); // Gunner, 13, carrying his own box
      figToddler(g, x + 1160); // Nolan underfoot
      doorway(g, x + 1290, true);
      lightShaft(g, x + 1290, FLOOR_Y - 300, 96, 120, 0.14, P.lamp);
    },
  },
  {
    id: "garage",
    x: (RW + GAP) * 7 + 600,
    w: RW + 300,
    draw(g, x) {
      // the workbench era — warm, alive
      pegboard(g, x + 540, 220, 340, 180);
      // kids' drawings pinned to the pegboard — the rocket again
      taped(g, x + 570, 250, 56, 44);
      taped(g, x + 650, 240, 44, 56);
      taped(g, x + 780, 260, 50, 40);
      desk(g, x + 520, 420, "bench");
      flatMonitor(g, x + 640, FLOOR_Y - 92, 96, 1, true);
      chairSimple(g, x + 500);
      figAdultSitting(g, x + 545, 1.02);
      // manuscripts stacked
      for (let i = 0; i < 4; i++)
        (g.fillStyle = "#12181d"), g.fillRect(x + 900 + (i % 2) * 4, FLOOR_Y - 92 - i * 10, 70, 10);
      // window with the porch light beyond
      window_(g, x + 1180, 220, 180, 220, 0.35);
      lightShaft(g, x + 1180, 226, 180, 100, 0.1, P.lamp);
      lamp(g, x + 1000, FLOOR_Y - 84, 1);
      // the family passing the doorway
      doorway(g, x + 1450, true);
      figWoman(g, x + 1492, "bun");
      figToddler(g, x + 1540);
    },
  },
];

export const WORLD_W = ROOMS[ROOMS.length - 1].x + ROOMS[ROOMS.length - 1].w + 500;

/* -------------------------------------------------------------- captions */

export type RoomCaption = { x1: number; x2: number; text: string; sub?: string };

const rx = (i: number) => ROOMS[i].x;

export const ROOM_CAPTIONS: RoomCaption[] = [
  { x1: rx(0) + 200, x2: rx(0) + 1300, text: "Ohio. A kid who drew all day, every day.", sub: "The desk this whole story happens at." },
  { x1: rx(1) + 200, x2: rx(1) + 900, text: "High school. First computer. Loud posters.", sub: "" },
  { x1: rx(1) + 900, x2: rx(1) + 1500, text: "Samantha. Junior year.", sub: "She's in every room after this one." },
  { x1: rx(2) + 200, x2: rx(2) + 1400, text: "Career school, then fine art.", sub: "Film, photo, code, music — anything they'd teach." },
  { x1: rx(3) + 150, x2: rx(3) + 1100, text: "The Corps. 2008 – 2013.", sub: "Married in June. Enlisted the same year. Combat photographer." },
  { x1: rx(3) + 1100, x2: rx(3) + 1900, text: "Gunner. November 1, 2009.", sub: "North Carolina. The room got smaller and better." },
  { x1: rx(4) + 150, x2: rx(4) + 1450, text: "Los Angeles. Taught myself to ship.", sub: "Saucey · Hush — first designer in, Head of Design out." },
  { x1: rx(5) + 150, x2: rx(5) + 800, text: "The remote years.", sub: "Spin · WWDC 2020 · VGV · Google I/O — the work commuted, I didn't." },
  { x1: rx(5) + 800, x2: rx(5) + 1700, text: "Nolan. 2021.", sub: "Los Angeles. The floor filled with toys." },
  { x1: rx(6) + 150, x2: rx(6) + 1450, text: "2023. We packed the whole life.", sub: "Lighter squares on the wall where the frames hung." },
  { x1: rx(7) + 150, x2: rx(7) + 1750, text: "Home. Cincinnati. The garage.", sub: "Boneyard · OLO · Weaver · the books — same desk, same kid." },
];
