/**
 * Delivered projects shown on /projects.
 *
 * Create-only, like the blog posts: once a project exists it is edited from /admin/projects.
 * Photos are compressed WebP files in prisma/seed/project-photos/<slug>/, attached only while
 * the project has no photos yet, so a photo removed or reordered in admin is never put back.
 */

export interface ProjectPhotoSeed {
  file: string;
  caption: string;
}

export interface ProjectSeed {
  slug: string;
  title: string;
  venue: string;
  description: string;
  eventDate: Date;
  published: boolean;
  photos: ProjectPhotoSeed[];
}

// Drafts carry the date their photos were shared (29 Sep 2026) until the real date is set in admin.
const PHOTOS_SHARED = new Date('2026-09-29');

export const PROJECTS: ProjectSeed[] = [
  {
    slug: 'icdl-training-alehu-police-kenha-nyanza',
    title: 'ICDL digital skills training for ALEHU police officers',
    venue: 'KeNHA Nyanza Regional Office, Airport Road, Kisumu',
    description: `We trained police officers of the Axle Load Enforcement and Highway Unit (ALEHU) working on the KeNHA corridor in the Nyanza region, under the ICDL digital skills programme.

Classes ran at the KeNHA Nyanza Regional Office on Airport Road in Kisumu. Officers worked on laptops through practical sessions, so the skills apply directly to the reports and records they handle every day.`,
    eventDate: PHOTOS_SHARED,
    published: false,
    photos: [
      { file: 'alehu-class.webp', caption: 'ALEHU officers in an ICDL class at the KeNHA Nyanza Regional Office' },
      { file: 'alehu-trainer-officers.webp', caption: 'Working through an exercise with two officers' },
      { file: 'alehu-session.webp', caption: 'An ICDL session in progress' },
    ],
  },
  {
    slug: 'rubana-weighbridges-anpr-rdu-traffic-lights',
    title: 'ANPR cameras, RDUs and traffic lights at Rubana weighbridges',
    venue: 'Rubana North and Rubana South weighbridges, Tanzania',
    description: `At the Rubana North and Rubana South weighbridges in Tanzania we installed number-plate (ANPR) cameras, remote display units (RDUs) that show drivers their weight, and automated the traffic lights that direct trucks on and off the scale.

The weighbridge's serial equipment is networked through an eight-port serial device server, so the cameras, displays and lights all work from the weighing software.`,
    eventDate: PHOTOS_SHARED,
    published: false,
    photos: [
      { file: 'rubana-traffic-light.webp', caption: 'Automated traffic light and remote display unit beside the weighing lane' },
      { file: 'rubana-lane-display.webp', caption: 'The lane at night, with the light holding the next truck' },
      { file: 'rubana-serial-server.webp', caption: 'Eight-port serial device server linking the weighbridge equipment to the network' },
    ],
  },
  {
    slug: 'migori-county-library-system',
    title: 'Library management system for Migori County Community Library',
    venue: 'Migori County Community Library, Migori',
    description: `We installed our Library Management system at the Migori County Community Library and set up the equipment the desk needs to run it.

Library staff then took part in user acceptance training: they worked through cataloguing, lending and returns on the live system before signing it off.`,
    eventDate: new Date('2026-07-29'),
    published: true,
    photos: [
      { file: 'migori-demo.webp', caption: 'Showing library staff the new system' },
      { file: 'migori-setup.webp', caption: 'Setting up the desk equipment in the library' },
      { file: 'migori-uat-meeting.webp', caption: 'User acceptance session with the library team' },
    ],
  },
  {
    slug: 'rongo-moyafarm-cctv',
    title: 'CCTV installation at Moyafarm, Rongo',
    venue: 'Moyafarm, Rongo',
    description: `Our field team installed a CCTV system at Moyafarm in Rongo: cameras, cabling and the recorder, set up so the farm can watch its compound live and play back recordings.`,
    eventDate: PHOTOS_SHARED,
    published: false,
    photos: [
      { file: 'rongo-team.webp', caption: 'The Codevertex field team on site with the equipment' },
      { file: 'rongo-engineer.webp', caption: 'Preparing camera fittings before installation' },
    ],
  },
  {
    slug: 'kanyonyo-weighbridge-anpr-cameras',
    title: 'Number-plate cameras at Kanyonyo weighbridge',
    venue: 'Kanyonyo Weighbridge Station, KeNHA',
    description: `We installed Dahua number-plate (ANPR) cameras at the Kanyonyo weighbridge station and connected them to the station's weighing software, so each truck's plate is captured with its weight.

The same integration drives the remote display units that show drivers their axle weights. The weighbridge connector we built for Kanyonyo now runs inside TruConnect, the TruLoad component that reads the scales at each station.`,
    eventDate: new Date('2025-01-21'),
    published: true,
    photos: [
      { file: 'kanyonyo-anpr-install.webp', caption: 'Mounting an ANPR camera in front of the Kanyonyo weighbridge station' },
      { file: 'kanyonyo-anpr-mast.webp', caption: 'Aligning a camera on its mast' },
      { file: 'kanyonyo-camera-bench.webp', caption: 'Configuring the cameras on the bench before installation' },
    ],
  },
  {
    slug: 'mucisa-hackathon-2025',
    title: 'MUCISA Hackathon 2025 panel',
    venue: 'Maseno University',
    description: `Members of our team served as panelists at the MUCISA Hackathon 2025 at Maseno University, working with the student teams on their projects and talking about careers in software.

The hackathon is part of our long-running work with Maseno University students on coding, digital entrepreneurship and employability skills.`,
    eventDate: new Date('2025-03-08'),
    published: true,
    photos: [
      { file: 'mucisa-panel.webp', caption: 'Codevertex panelists at the MUCISA Hackathon 2025' },
      { file: 'mucisa-talk.webp', caption: 'Talking to the teams about building and shipping software' },
      { file: 'mucisa-pairing.webp', caption: 'Working through a team\'s code' },
      { file: 'mucisa-laptops.webp', caption: 'Teams at work in the lecture hall' },
    ],
  },
];
