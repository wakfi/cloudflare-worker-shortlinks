import linksJson from './links'

// We use a Map as a fast lookup table. This also would allow for a system to add & remove links
// dynamically (e.g. via a GUI or command line client, for convenience) with little overhead
const shortlinks = new Map(Object.entries(linksJson));

const home =
`<!DOCTYPE html>
<html lang="en">
<head>
	<meta name="robots" content="noindex, nofollow">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Website</title>
	<meta name="description" content="Wow"/>
	<meta property="og:description" content="Wow"/>
	<meta property="og:locale" content="en_US"/>
	<meta name="twitter:card" content="summary"/>
	<meta property="twitter:title" content="Website"/>
	<style>
		h1 {
			font-family: "Times New Roman", Times, serif;
			text-align: center;
			margin: 0 auto;
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
		}
	</style>
</head>
<body>
	<h1>Website</h1>
</body>
</html>`;

// Declare our handler that will generate the Response to incoming fetch requests
addEventListener('fetch', event => {
	event.respondWith(handleRequest(event));
});

// You want to blackbox this process in a function, so that if you ever want to have
// a more complex way of defining links (perhaps an object like { link: "", plural: true }),
// you won't need to change anything other than this function to support it
function fetchRedirect(target) {
	return shortlinks.get(target);
}

// This parameter is from destructuring the event passed by the fetch listener
async function handleRequest({ request }) {
	// Modularize response handler so we can reuse it. We
	// define this within handleRequest so we don't have to
	// pass event/request if needed for a more advanced response
	const response = (destination) => {
		if(!destination) {
			// Very basic 404 Not Found response
			return new Response('Shortlink not found', {
				status: 404,
				statusText: "Not Found"
			});

			// If your site has a custom 404 page, use this instead.
			// Or, if using this alongside a normal website on the same
			// domain, also use this instead so that your non-shortlink
			// pages still work
			return fetch(request);
		}

		// HTTP 307 is essentially the same as 302, but solves some problems
		// caused by some early web clients. See
		// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/307 for
		// more details
		return Response.redirect(destination, 307);
	}

	try {
		const url = new URL(request.url);
		const target = url.pathname.slice(1);
		if(!target) {
			// The target is our base domain without any path. This example uses some
			// simple HTML as a placeholder for a real homepage. In practice, you may
			// want to redirect to your standard homepage, if on a different domain
			return new Response(home, {
				headers: {
					'content-type': 'text/html;charset=UTF-8'
				}
			});
		}

		// Lookup what URL the shortlink maps to, if any
		const destination = fetchRedirect(target);
		// Delegate to our response routine
		return response(destination);
	} catch(e) {
		// If something ever goes wrong, we still want to display
		// something to the user. Another option could be to redirect
		// to your homepage here, instead of passing null
		console.error(e);
		return response(null);
	}
}
