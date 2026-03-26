import { useEffect } from 'react';

interface PageMetaProps {
  title: string;
  description?: string;
  canonicalPath?: string;
  noIndex?: boolean;
}

const DEFAULT_DESCRIPTION = 'Whopautopailot - Revolutionary organic social media growth platform. Get natural engagement with variable delivery patterns. 100% safe for your accounts.';
const SITE_NAME = 'Whopautopailot';
const BASE_URL = 'https://whopautopailot.pro';

export function PageMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalPath,
  noIndex = false
}: PageMetaProps) {
  useEffect(() => {
    // Set title
    const fullTitle = title === 'Home'
      ? `${SITE_NAME} - Smart Automation Console`
      : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }

    // Update OG title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', fullTitle);
    }

    // Update OG description
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', description);
    }

    // Handle canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalPath) {
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', `${BASE_URL}${canonicalPath}`);
    } else if (canonicalLink) {
      canonicalLink.remove();
    }

    // Handle robots meta for noindex
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (noIndex) {
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute('content', 'noindex, nofollow');
    } else if (robotsMeta) {
      robotsMeta.remove();
    }

    // Cleanup on unmount
    return () => {
      if (robotsMeta && noIndex) {
        robotsMeta.remove();
      }
    };
  }, [title, description, canonicalPath, noIndex]);

  return null;
}
