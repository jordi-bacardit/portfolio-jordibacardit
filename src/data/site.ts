// Personal info and links: the single source of truth for the whole site.
// Unknown values stay null with a TODO(content) note. Components hide them where
// they are optional and show a visible [TODO] placeholder where they are required.

export interface NavItem {
  label: string;
  href: string;
}

export const site = {
  name: 'Jordi Bacardit',
  // The focus, not a job title: never "Game Designer" on its own.
  role: 'Game Design',
  description:
    'Portfolio of Jordi Bacardit, a video games engineering student at UVic working towards a career in game design.',
  study: {
    degree: 'Multimedia, Applications & Video Games Engineering',
    school: 'Universitat de Vic (UVic)',
    country: 'Spain',
    graduation: 'Late 2027' as string | null,
  },
  location: 'Barcelona, Spain',
  openToRelocation: true,
  languages: 'Catalan and Spanish (native), English (advanced)',
  lookingFor: 'Open to game design internships and junior roles in the European games industry',
  status: 'Open to internships and junior roles',
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
