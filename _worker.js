// Invoked only for internal source paths listed in _routes.json.
// Public HTML, analytics and advertising continue through static Pages assets.
export default {
  async fetch(request, env) {
    const path = decodeURIComponent(new URL(request.url).pathname);
    if (/^\/(?:config|scripts|tests|_private)(?:\/|$)/.test(path) ||
        /\.(?:md|py|pyc)$/i.test(path) || /^\/_template(?:\.html)?\/?$/.test(path)) {
      return new Response('Not found', {
        status: 404,
        headers: {'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff'}
      });
    }
    return env.ASSETS.fetch(request);
  }
};
