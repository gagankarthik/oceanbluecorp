/**
 * Photographs, shown in one greyscale treatment.
 * Ohio photographs (public/photos/ohio) are public domain or CC0; their sources
 * are recorded in public/photos/ohio/credits.json. The rest are Unsplash-licensed.
 * None is presented as Oceanblue's own office or people.
 */
export const photos = {
  tower: { src: "/photos/ohio/downtown-columbus-view-from-main-st-bridge.jpg", alt: "Downtown Columbus, Ohio, seen from the Main Street Bridge over the Scioto River", credit: "Paul Wasneski (public domain)" },
  facade: { src: "/photos/stepped-facade.jpg", alt: "The stepped corner of a white building", credit: "Julien Moreau" },
  lattice: { src: "/photos/ohio/ohio-statehouse-rotunda.jpg", alt: "The rotunda of the Ohio Statehouse in Columbus, seen from below", credit: "Ibagli (CC0)" },
  concrete: { src: "/photos/concrete-corner.jpg", alt: "An angular white concrete building against a dark sky", credit: "Carl Nenzen Loven" },
  bridge: { src: "/photos/arched-bridge.jpg", alt: "An arched bridge over grey water", credit: "Matthew Wiebe" },

  // Work and places
  engineerLaptop: { src: "/photos/work/engineer-laptop.jpg", alt: "An engineer working on a laptop", credit: "Alejandro Escamilla" },
  phoneLaptop: { src: "/photos/work/phone-laptop.jpg", alt: "A consultant checking a phone beside a laptop", credit: "Alejandro Escamilla" },
  typing: { src: "/photos/work/typing.jpg", alt: "Hands typing on a laptop at a desk", credit: "Alejandro Escamilla" },
  teamTable: { src: "/photos/work/team-table.jpg", alt: "Colleagues meeting around a table with notes and a tablet", credit: "Alejandro Escamilla" },
  workstation: { src: "/photos/work/workstation.jpg", alt: "An engineer's workstation seen from above", credit: "Vadim Sherbakov" },
  londonNight: { src: "/photos/work/london-night.jpg", alt: "St Paul's Cathedral and the Thames in London at night", credit: "Vadim Sherbakov" },
  notebookLaptop: { src: "/photos/work/notebook-laptop.jpg", alt: "A laptop and an open notebook during a training session", credit: "Galymzhan Abdugalimov" },
  skyline: { src: "/photos/ohio/skyline-columbus-ohio-original-image.webp", alt: "The Columbus, Ohio skyline with the LeVeque Tower above the Scioto River", credit: "Carol M. Highsmith, Library of Congress (public domain)" },
  civicDome: { src: "/photos/ohio/ohio-statehouse-columbus-original-image.webp", alt: "The Ohio Statehouse in Columbus", credit: "Carol M. Highsmith, Library of Congress (public domain)" },
  columbusRiver: { src: "/photos/ohio/skyline-columbus-ohio-original-image-2.webp", alt: "The Columbus, Ohio skyline across the Scioto River", credit: "Carol M. Highsmith, Library of Congress (public domain)" },
  plant: { src: "/photos/work/plant.jpg", alt: "Pipework and tanks at an industrial plant", credit: "Unsplash" },
  console: { src: "/photos/work/console.jpg", alt: "Hands adjusting controls on an operations console", credit: "Unsplash" },
  tablet: { src: "/photos/work/tablet.jpg", alt: "A hand using a tablet", credit: "Unsplash" },
  keyboard: { src: "/photos/work/keyboard.jpg", alt: "A keyboard and mouse at a security analyst's desk", credit: "Unsplash" },
  glassOffice: { src: "/photos/work/glass-office.jpg", alt: "Colleagues talking by the windows of a high-rise office", credit: "Unsplash" },
  windowDesk: { src: "/photos/work/window-desk.jpg", alt: "A laptop on a desk by an office window", credit: "Unsplash" },
  deskTop: { src: "/photos/work/desk-top.jpg", alt: "A tidy desk with a computer, keyboard and tablet", credit: "Unsplash" },
  meetingRoom: { src: "/photos/work/meeting-room.jpg", alt: "A bright meeting room", credit: "Unsplash" },
  fireworks: { src: "/photos/work/fireworks.jpg", alt: "Fireworks over a city at night", credit: "Unsplash" },
  litOffice: { src: "/photos/work/lit-office.jpg", alt: "An office building with its windows lit at night", credit: "Unsplash" },
  restaurant: { src: "/photos/work/restaurant.jpg", alt: "A restaurant interior with coffee cups on a long wooden table", credit: "Unsplash" },
  writingDesk: { src: "/photos/work/writing-desk.jpg", alt: "Notebooks and a typewriter on a wooden desk", credit: "Unsplash" },
} as const;

export type PhotoKey = keyof typeof photos;

export const photoCredits = `Architecture photographs by ${Object.values(photos)
  .map((p) => p.credit)
  .join(", ")} on Unsplash.`;
