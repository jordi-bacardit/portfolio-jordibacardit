// Personal info and links: the single source of truth for the whole site.
// Unknown values stay null with a TODO(content) note. Components hide them where
// they are optional and show a visible [TODO] placeholder where they are required.

export interface NavItem {
  label: string;
  href: string;
}

export const site = {
  name: 'Jordi Bacardit',
  role: 'Game Production / Game Development',
  description:
    'Portfolio of Jordi Bacardit, Multimedia, Applications & Video Games Engineering student at Universitat de Vic (UVic), focused on game production with a technical game-development background.',
  study: {
    degree: 'Multimedia, Applications & Video Games Engineering',
    school: 'Universitat de Vic (UVic)',
    country: 'Spain',
    graduationYear: null as string | null, // TODO(content): graduation year
  },
  location: 'Barcelona, Spain',
  openToRelocation: true,
  lookingFor: 'Open to internships and junior roles in the European games industry',
  status: 'Open to internships and junior roles',
  email: 'jordibacardit12@gmail.com' as string | null,
  linkedin: 'https://www.linkedin.com/in/jordi-bacardit/' as string | null,
  github: 'https://github.com/jordi-bacardit' as string | null,
  cv: '/cv/jordi-bacardit-cv.pdf' as string | null,
};

export const nav: NavItem[] = [
  { label: 'About', href: '/about' },
  { label: 'Work', href: '/work' },
  { label: 'Game Library', href: '/game-library' },
  { label: 'Contact', href: '/contact' },
];

export const technologies = [
  { category: 'Engines', items: ['Unreal Engine', 'Unity'] },
  { category: 'Languages', items: ['C#', 'C++', 'C', 'JavaScript', 'Python', 'Kotlin', 'PHP'] },
  { category: 'Web and data', items: ['Laravel', 'Astro', 'Tailwind CSS', 'MySQL', 'MongoDB'] },
  { category: 'Tools', items: ['Git', 'GitHub', 'Visual Studio Code', 'Android Studio'] },
];
