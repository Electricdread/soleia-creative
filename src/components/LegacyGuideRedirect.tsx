import { Navigate, useLocation } from 'react-router-dom';

/**
 * `/creativeguide` → `/creative-guide`.
 *
 * The guide is spoken of and typed without the hyphen often enough that the
 * unhyphenated path has appeared in handoffs and in the owner's own messages.
 * Netlify answers it with a 301 (see netlify.toml); this route covers the dev
 * server and the preview build, which have no Netlify in front of them, and
 * keeps any sub-path and #anchor intact.
 */
export function LegacyGuideRedirect() {
  const { pathname, search, hash } = useLocation();
  const rest = pathname.replace(/^\/creativeguide/i, '');
  return <Navigate to={`/creative-guide${rest}${search}${hash}`} replace />;
}

export default LegacyGuideRedirect;
