import type { NextConfig } from 'next';

// Old course slugs (pre-rename, and courses removed in the ICDL Levels 1–5 revamp)
// → their current course page. The /digitika/[courseId] route resolves by course
// id, but several courses have a different historical slug and some old courses no
// longer exist, so previously shared / search-indexed links would 404 without these.
const COURSE_SLUG_REDIRECTS: Record<string, string> = {
  // Renamed courses (old slug → current id)
  'devops-cloud': 'devops',
  'cybersecurity': 'cybersec',
  'scratch-python': 'kids-scratch',
  'web-design-teens': 'teens-web',
  'game-dev': 'kids-games',
  'ccna-exam-prep': 'ccna-cert',
  'ai-for-business': 'ai-business',
  'data-powerbi': 'power-bi',
  'data-sql': 'sql-db',
  'data-advanced': 'advanced-analytics',
  // ICDL revamp: combined "Levels 4 & 5" split, Digital Citizen folded into Level 1
  'icdl-l45': 'icdl-l4',
  'icdl-citizen': 'icdl-l1',
  'icdl-digital-citizen': 'icdl-l1',
  'icdl-core': 'icdl-l2',
  'icdl-advanced': 'icdl-l4',
  'icdl-professional': 'icdl-l5',
};

const nextConfig: NextConfig = {
  output: 'standalone',

  reactCompiler: false,

  experimental: {},

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.codevertexitsolutions.com' },
    ],
  },

  serverExternalPackages: ['pg', 'pg-pool', '@prisma/adapter-pg', '@prisma/client'],

  async redirects() {
    return [
      ...Object.entries(COURSE_SLUG_REDIRECTS).map(([from, to]) => ({
        source: `/digitika/${from}`,
        destination: `/digitika/${to}`,
        permanent: true,
      })),
      // Safety net: a stray nested course path (e.g. /digitika/icdl-l3/l5) is not a
      // real route and would 404 — collapse it to the base course page instead.
      { source: '/digitika/:courseId/:rest+', destination: '/digitika/:courseId', permanent: false },
    ];
  },
};

export default nextConfig;
