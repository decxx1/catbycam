# Objetivo
Crear una tienda online para la empresa Cat By Cam.

## Stacks
- Astro (en su última versión = 5.16.15 )
- Vue (versión = 3.5.27)
- Tailwind ( versión = 4.1.18)
- Empaquetador: Bun 1.3.4

## Características del desarrollo
Con el framework Astro debemos utilizar:
- Páginas estáticas para las páginas de inicio, catálogo, contacto, productos, etc.
- SSR para las páginas de login, pagos (checkout), dashboard y toda la parte de administración donde gestionaremos los pedidos, usuarios etc..
- 10.4.27-MariaDB para la DB (hay que crear una) (usuario:root,contraseña:"",port:3306,host:127.0.0.1)
- Usaremos poco JS pero siempre que sea conveniente y se pueda crearemos componentes de VUE para reactividad.
- MercadoPago como pasarela para los pagos.

### Forma de Trabajo
Trabajaremos siempre con las mejores prácticas para realizar un proyecto profesional y escalable, siguiendo los principios SOLID y las buenas prácticas de programación.

En el frontend:
- Usaremos un Layout para las páginas de la web, otro layout para los usuarios autenticados y otro para los administradores (la sección de administración)
- siempre que usemos typescript intentar tipar con las mejores prácticas.
- para la carpeta "src/*" tenemos un atajo que es "@/*". Por ej: "@/components/footer.astro"
- Siempre que se pueda componetizaremos y aclararemos en sub-carpetas de donde es el componente por ejemplo "components/web/footer.astro"
- Siempre usaremos tailwind 4 para estilar
- Crearemos un archivo utils para las funciones comunes y reutilizables, y como ese se pueden crear otros siguiendo el mismo patrón.

En el backend: 
- Debemos tener bien estructurado el proyecto, siguiendo el patrón de capas (Modelo, Vista, Controlador... o el mejor para este proyecto, siempre y cuando sea lo mejor para el proyecto)
- crearemos la lógica en una carpeta services/ con sus respectivas subcarpetas
- Seguimos los principios SOLID y las buenas prácticas de programación.

## Astro

> Astro is an all-in-one web framework for building websites. 

- Astro uses island architecture and server-first design to reduce client-side JavaScript overhead and ship high performance websites.
- Astro’s friendly content-focused features like content collections and built-in Markdown support make it an excellent choice for blogs, marketing, and e-commerce sites amongst others.
- The `.astro` templating syntax provides powerful server rendering in a format that follows HTML standards and will feel very familiar to anyone who has used JSX.
- Astro supports popular UI frameworks like React, Vue, Svelte, Preact, and Solid through official integrations.
- Astro is powered by Vite, comes with a fast development server, bundles your JavaScript and CSS for you, and makes building websites feel fun.

## Features

[Section titled “Features”](#features)

**Astro is an all-in-one web framework.** It includes everything you need to create a website, built-in. There are also hundreds of different [integrations](https://astro.build/integrations/) and [API hooks](/en/reference/integrations-reference/) available to customize a project to your exact use case and needs.

Some highlights include:

* **[Islands](/en/concepts/islands/):** A component-based web architecture optimized for content-driven websites.
* **[UI-agnostic](/en/guides/framework-components/):** Supports React, Preact, Svelte, Vue, Solid, HTMX, web components, and more.
* **[Server-first](/en/guides/on-demand-rendering/):** Moves expensive rendering off of your visitors’ devices.
* **[Zero JS, by default](/en/basics/astro-components/):** Less client-side JavaScript to slow your site down.
* **[Content collections](/en/guides/content-collections/):** Organize, validate, and provide TypeScript type-safety for your Markdown content.
* **[Customizable](/en/guides/integrations-guide/):** Partytown, MDX, and hundreds of integrations to choose from.

## Documentation Sets

- [Abridged documentation](https://docs.astro.build/llms-small.txt): a compact version of the documentation for Astro, with non-essential content removed
- [Complete documentation](https://docs.astro.build/llms-full.txt): the full documentation for Astro
- [API Reference](https://docs.astro.build/_llms-txt/api-reference.txt): terse, structured descriptions of Astro’s APIs
- [How-to Recipes](https://docs.astro.build/_llms-txt/how-to-recipes.txt): guided examples of adding features to an Astro project
- [Build a Blog Tutorial](https://docs.astro.build/_llms-txt/build-a-blog-tutorial.txt): a step-by-step guide to building a basic blog with Astro
- [Deployment Guides](https://docs.astro.build/_llms-txt/deployment-guides.txt): recipes for how to deploy an Astro website to different services
- [CMS Guides](https://docs.astro.build/_llms-txt/cms-guides.txt): recipes for how to use different content management systems in an Astro project
- [Backend Services](https://docs.astro.build/_llms-txt/backend-services.txt): advice on how to integrate backend services like Firebase, Sentry, and Supabase in an Astro project
- [Additional Guides](https://docs.astro.build/_llms-txt/additional-guides.txt): guides to e-commerce, authentication, testing, and digital asset management in Astro projects

## Notes

- The complete documentation includes all content from the official documentation
- The content is automatically generated from the same source as the official documentation

## Optional

- [The Astro blog](https://astro.build/blog/): the latest news about Astro development