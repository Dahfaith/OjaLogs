import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogType?: 'website' | 'product' | 'article';
  ogImage?: string;
  noindex?: boolean;
  schema?: Record<string, any> | Record<string, any>[];
}

const DEFAULT_TITLE = 'Ojalogs | Premium Digital Accounts, Virtual Numbers & SMM Growth';
const DEFAULT_DESCRIPTION = "Nigeria's premier verified marketplace for aged social accounts (Facebook, Instagram, Twitter/X), instant SMS virtual numbers, OTP verification, and high-impact social boost services. Instant encrypted delivery.";
const DEFAULT_KEYWORDS = 'buy facebook account, aged facebook accounts, buy instagram accounts, buy twitter accounts, buy gmail accounts, virtual numbers nigeria, buy sms otp number, temporary phone numbers, smm panel nigeria, buy followers nigeria, ojalogs, digital logs nigeria, buy vpn nigeria, buy proxy nigeria';
const BASE_URL = 'https://ojalogs.com.ng';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

export const SEO: React.FC<SEOProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonical,
  ogType = 'website',
  ogImage = DEFAULT_OG_IMAGE,
  noindex = false,
  schema
}) => {
  const location = useLocation();

  useEffect(() => {
    // 1. Page Title
    const fullTitle = title ? `${title} | Ojalogs` : DEFAULT_TITLE;
    document.title = fullTitle;

    // Helper to set or create meta tag
    const setMetaTag = (attribute: string, attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${attribute}="${attrValue}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to set or create link tag
    const setLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // 2. Primary Meta Tags
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', keywords);

    // 3. Robots Directives
    if (noindex) {
      setMetaTag('name', 'robots', 'noindex, nofollow');
    } else {
      setMetaTag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    }

    // 4. Canonical URL
    const canonicalUrl = canonical
      ? canonical.startsWith('http') ? canonical : `${BASE_URL}${canonical}`
      : `${BASE_URL}${location.pathname}`;
    setLinkTag('canonical', canonicalUrl);

    // 5. Open Graph Meta Tags
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:image', ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage}`);

    // 6. Twitter Card Meta Tags
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage}`);

    // 7. Dynamic JSON-LD Structured Data
    const SCRIPT_ID = 'ojalogs-page-schema';
    let scriptTag = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (schema) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = SCRIPT_ID;
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.text = JSON.stringify(
        Array.isArray(schema)
          ? { '@context': 'https://schema.org', '@graph': schema }
          : { '@context': 'https://schema.org', ...schema }
      );
    } else if (scriptTag) {
      scriptTag.remove();
    }

    // Cleanup on unmount or page change
    return () => {
      const dynamicScript = document.getElementById(SCRIPT_ID);
      if (dynamicScript) dynamicScript.remove();
    };
  }, [title, description, keywords, canonical, ogType, ogImage, noindex, schema, location.pathname]);

  return null;
};
