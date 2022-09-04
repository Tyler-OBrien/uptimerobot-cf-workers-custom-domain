Cloudflare Worker to proxy Uptime Robot Status Page to put it on a Custom Domain.

You can upload this script within the dashboard, no need for wrangler or any special compat flags.

Just change STATUS_PAGE_URL to the URL of the Custom Domain you want the status page on. You'll need to add a Worker Custom Domain, or an HTTP Route to get it to work. You will also need to set UPTIME_ROBOT_PAGE_URL. This is the ID at the end of your dashboard URL, i.e https://stats.uptimerobot.com/ByZ8xiDxWV <- ByZ8xiDxWV of that.
