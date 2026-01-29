import { auth } from "@/lib/auth";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
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
  const { pathname } = context.url;
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
