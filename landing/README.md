# StyrCan Landing Page

Static marketing website for StyrCan, built with [Eleventy](https://www.11ty.dev/).

## Overview

This is the public-facing marketing site hosted at `styrcan.com`. The main application is hosted separately at `use.styrcan.com`.

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The site will be available at `http://localhost:8080`.

### Build for Production

```bash
npm run build
```

The built site will be in the `_site` directory.

## Project Structure

```
landing/
├── src/
│   ├── _data/          # Global data files
│   │   └── site.json   # Site configuration
│   ├── _includes/      # Partial templates
│   ├── _layouts/       # Page layouts
│   │   └── base.njk    # Base HTML template
│   ├── assets/         # Static assets (images, fonts)
│   ├── css/            # Stylesheets
│   │   └── styles.css  # Main CSS file
│   ├── js/             # JavaScript files
│   │   └── main.js     # Main JS file
│   ├── index.njk       # Homepage
│   ├── about.njk       # About page
│   └── contact.njk     # Contact page
├── .eleventy.js        # Eleventy configuration
├── package.json
└── README.md
```

## Pages

- `/` - Homepage with hero, features, pricing, and contact form
- `/about` - About page with company info and team
- `/contact` - Contact page with form

## Deployment

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/_site /usr/share/nginx/html
EXPOSE 80
```

### Static Hosting

The `_site` directory can be deployed to any static hosting service:

- Nginx
- Apache
- Netlify
- Vercel
- Cloudflare Pages
- GitHub Pages

## Links

- **Marketing Site**: https://styrcan.com
- **Application**: https://use.styrcan.com
- **API**: https://use.styrcan.com/api
