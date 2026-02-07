import { auth } from "@/lib/auth";
import { defineMiddleware } from "astro:middleware";

const prerenderedRoutes = ["/", "/contact"];

function isPrerenderedRoute(pathname: string): boolean {
  const normalized = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  return prerenderedRoutes.includes(normalized);
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (isPrerenderedRoute(pathname)) {
    context.locals.user = null;
    context.locals.session = null;
    return next();
  }

  const isAuthed = await auth.api.getSession({
    headers: context.request.headers,
  });

  if (isAuthed) {
    context.locals.user = isAuthed.user;
    context.locals.session = isAuthed.session;
  } else {
    context.locals.user = null;
    context.locals.session = null;
  }

  // Proteger rutas admin
  const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isAdminApiRoute = pathname.startsWith("/api/admin");

  if (isAdminRoute || isAdminApiRoute) {
    if (!isAuthed) {
      if (isAdminApiRoute) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      return context.redirect("/admin/login");
    }

    // Verificar rol admin
    const userRole = (isAuthed.user as any).role;
    if (userRole !== "admin") {
      if (isAdminApiRoute) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
      return context.redirect("/");
    }
  }

  return next();
});
