import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'nl'],

  // Used when no locale matches
  defaultLocale: 'en',

  // The `pathnames` object can be used to provide
  // locale-specific pathnames
  pathnames: {
    '/': '/',
    '/dashboard': {
      en: '/dashboard',
      nl: '/dashboard',
    },
    '/organizations': {
      en: '/organizations',
      nl: '/organisaties',
    },
    '/projects': {
      en: '/projects',
      nl: '/projecten',
    },
    '/templates': {
      en: '/templates',
      nl: '/sjablonen',
    },
    '/admin': {
      en: '/admin',
      nl: '/beheer',
    },
  },
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
