// CONFIGURABLE
// THE DOMAIN YOU WANT YOUR STATUS PAGE TO BE UNDER. USE THE DEFAULT WORKERS URL, OR USE CUSTOM DOMAINS/WORKER ROUTES TO BIND IT TO ONE OF YOUR OWN DOMAINS, AND UPDATE THIS
const STATUS_PAGE_URL = "status.tylerobrien.dev"
// THIS IS THE ID AT THE END OF YOUR DASHBOARD URL, i.e https://stats.uptimerobot.com/ByZ8xiDxWV
const UPTIME_ROBOT_PAGE_URL = "ByZ8xiDxWV"


// SHOULD NOT NEED TO CHANGE ANYTHING BELOW
const UPTIME_ROBOT_URL = "stats.uptimerobot.com"
const STATUS_PAGE_URL_WITH_SCHEME = "https://" + STATUS_PAGE_URL;
const UPTIME_ROBOT_URL_WITH_SCHEME = "https://" + UPTIME_ROBOT_URL;


async function handleRequest(request) {
    const url = new URL(request.url);
    url.host = UPTIME_ROBOT_URL;

    // When you click on a specific monitor and then click the back button, it includes the status page ID, so we need to redirect back to index manually.
    const {
        pathname
    } = url;
    if (pathname.startsWith("/" + UPTIME_ROBOT_PAGE_URL)) {
        return Response.redirect(STATUS_PAGE_URL_WITH_SCHEME, 302)
    }

    // Static Asset/API Paths, can't prepend status page URL to them
    if (pathname.startsWith("/api") || pathname.startsWith("/assets")) {
        return fetch(url);
    }

    // For all other requests (index, monitor pages), forward to origin w/ dashboard tag appended
    url.pathname = "/" + UPTIME_ROBOT_PAGE_URL + pathname;
    const res = await fetch(url);

    const contentType = res.headers.get('Content-Type');
    // If the response is HTML, it can be transformed with
    // HTMLRewriter -- otherwise, it should pass through
    if (contentType.startsWith('text/html')) {
        return rewriter.transform(res);
    } else {
        return res;
    }
}

// Used to rewrite link tags, img tags, etc
class AttributeRewriter {
    constructor(attributeName) {
        this.attributeName = attributeName;
    }
    element(element) {
        const attribute = element.getAttribute(this.attributeName);
        if (attribute) {
            element.setAttribute(this.attributeName, attribute.replace(UPTIME_ROBOT_URL, STATUS_PAGE_URL));
        }
    }
}
// Used to make the API work on custom domain. Otherwise we would get blocked by CORS. This is kind of a hack, monkeypatching the XHR Open method to overwrite the URL. If Uptimerobot ever changes their status page, this will likely break.
class MonkeyPatchXHRRewriter {
    element(element) {
        element.prepend(`
    <script>
    (function(open, send) {
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        if (url.includes("${UPTIME_ROBOT_URL_WITH_SCHEME}")) {
            url = url.replace("${UPTIME_ROBOT_URL_WITH_SCHEME}", "${STATUS_PAGE_URL_WITH_SCHEME}")
        }
        open.apply(this, arguments); // reset/reapply original open method
    };
})(XMLHttpRequest.prototype.open)</script>`, {
            html: true
        })
    }
}

/* Doesn't work well, has issues with some encoding of files. Will just use a monkeypatch for now.
class ScriptTextRewriter {
    constructor() {
      this.buffer = ''
    }
    text(text) {
    this.buffer += text.text

    if (text.lastInTextNode) {
      // We're done with this text node -- search and replace and reset.
      if (this.buffer.includes("${UPTIME_ROBOT_URL_WITH_SCHEME}""))
      {
      text.replace(this.buffer.replaceAll("${UPTIME_ROBOT_URL_WITH_SCHEME}", "STATUS_PAGE_URL_WITH_SCHEME"))
      }
      else {
      text.replace(this.buffer);
      }
      this.buffer = ''
    } else {
      // This wasn't the last text chunk, and we don't know if this chunk
      // will participate in a match. We must remove it so the client
      // doesn't see it.
      text.remove()
    }
  }
}
*/



// Rewriter
const rewriter = new HTMLRewriter()
    .on('a', new AttributeRewriter('href'))
    .on('base', new AttributeRewriter('href'))
    .on('link', new AttributeRewriter('href'))
    .on('img', new AttributeRewriter('src'))
    .on('body', new MonkeyPatchXHRRewriter());

//.on('script', new ScriptTextRewriter())


addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});
