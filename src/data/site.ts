// Personal info and links: the single source of truth for the whole site.
// Unknown values stay null with a TODO(content) note, and the pages hide what's missing
// (no [TODO] placeholders on the live site since 2026-10-01).

export interface NavItem {
  label: string;
  href: string;
}

export const site = {
  name: 'Jordi Bacardit',
  // The focus, not a job title: never "Producer" or "Game Designer" on its own.
  role: 'Game Production & Design',
  description:
    'Portfolio of Jordi Bacardit: game production and design, with a background in video games engineering.',
  // Education, shown as the degree and the university only: never "student", a graduation date
  // or whether the degree is still in progress (2026-10-13).
  study: {
    degree: 'Multimedia, Applications & Video Games Engineering',
    school: 'Universitat de Vic (UVic)',
    country: 'Spain',
  },
  location: 'Barcelona, Spain',
  openToRelocation: true,
  languages: 'Catalan and Spanish (native), English (advanced)',
  lookingFor: 'Open to game production and design roles in the European games industry',
  status: 'Open to game production and design roles',
  // The line that opens the Contact page and the village's Contact panel.
  contactPitch: 'Open to game production and design roles, networking and collaboration.',
  email: 'jordibacardit12@gmail.com' as string | null,
  linkedin: 'https://www.linkedin.com/in/jordi-bacardit/' as string | null,
  github: 'https://github.com/jordi-bacardit' as string | null,
  cv: '/cv/jordi-bacardit-cv.pdf' as string | null,
};

// Game Library is not in the nav: it's reached from About (and stays at /game-library).
export const nav: NavItem[] = [
  { label: 'About', href: '/about' },
  { label: 'Work', href: '/work' },
  { label: 'Contact', href: '/contact' },
];

export const technologies = [
  { category: 'Design & production', items: ['Figma', 'Trello', 'Google Sheets'] },
  { category: 'Engines', items: ['Unreal Engine', 'Unity'] },
  {
    category: 'Languages',
    items: ['C#', 'C++', 'C', 'JavaScript', 'Python', 'Kotlin', 'Swift', 'PHP'],
  },
  { category: 'Web and data', items: ['Laravel', 'Astro', 'Tailwind CSS', 'MySQL', 'MongoDB'] },
  { category: 'Tools', items: ['Git', 'GitHub', 'Visual Studio Code', 'Android Studio'] },
];
