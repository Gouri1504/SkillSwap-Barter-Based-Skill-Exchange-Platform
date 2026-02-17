export function calculateCompatibilityScore(
  userASkillsOffered: string[],
  userASkillsWanted: string[],
  userBSkillsOffered: string[],
  userBSkillsWanted: string[]
): number {
  let score = 0;

  const aOffersWhatBWants = userASkillsOffered.filter((skill) =>
    userBSkillsWanted.includes(skill)
  );
  const bOffersWhatAWants = userBSkillsOffered.filter((skill) =>
    userASkillsWanted.includes(skill)
  );

  score += aOffersWhatBWants.length * 30;
  score += bOffersWhatAWants.length * 30;

  if (aOffersWhatBWants.length > 0 && bOffersWhatAWants.length > 0) {
    score += 20;
  }

  return Math.min(score, 100);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function generateMeetingLink(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `meet-${result}`;
}

export function getPaginationParams(page?: number, limit?: number) {
  const p = Math.max(1, page || 1);
  const l = Math.min(50, Math.max(1, limit || 10));
  const skip = (p - 1) * l;
  return { page: p, limit: l, skip };
}

export const SKILL_CATEGORIES = [
  'Programming',
  'Design',
  'Marketing',
  'Music',
  'Language',
  'Writing',
  'Photography',
  'Video',
  'Business',
  'Cooking',
  'Fitness',
  'Art',
  'Data Science',
  'DevOps',
  'Mobile Development',
  'Game Development',
  'Cybersecurity',
  'Cloud Computing',
  'Public Speaking',
  'Other',
] as const;

export const TRENDING_SKILLS = [
  'React', 'Python', 'Machine Learning', 'UI/UX Design', 'TypeScript',
  'Node.js', 'Data Analysis', 'Graphic Design', 'Video Editing', 'Spanish',
  'Digital Marketing', 'Photography', 'Blockchain', 'AWS', 'Flutter',
] as const;
