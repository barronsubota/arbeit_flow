const defaultBasePath = import.meta.env.BASE_URL;

export function getRouteHref(path: string, basePath = defaultBasePath): string {
  const base = basePath.replace(/\/+$/, "");
  const route = path.startsWith("/") ? path : `/${path}`;
  return `${base}${route}` || "/";
}

export function getCurrentRoute(
  pathname = window.location.pathname,
  basePath = defaultBasePath,
): string {
  const currentPath = pathname.replace(/\/+$/, "") || "/";
  const base = basePath.replace(/\/+$/, "");

  if (!base) {
    return currentPath;
  }

  if (currentPath === base) {
    return "/";
  }

  if (currentPath.startsWith(`${base}/`)) {
    return currentPath.slice(base.length) || "/";
  }

  return currentPath;
}
