# ERPNext Customer Portal PWA

A Progressive Web App (PWA) built with React, TypeScript, and Vite that serves as a customer portal for ERPNext. This application allows customers to manage orders, view invoices, check price lists, submit feedback, and more.

## Features

- **Authentication**: Secure login/logout with ERPNext integration
- **Order Management**: Place and track orders with real-time status updates
- **Invoice Management**: View and download invoices
- **Price Lists**: Check current prices by location
- **Feedback & Complaints**: Submit feedback, complaints, and returns
- **News Feed**: Stay updated with company announcements
- **PWA Support**: Install as a native app on mobile devices
- **Responsive Design**: Mobile-first interface with Tailwind CSS

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: Zustand
- **API Requests**: Axios
- **PWA**: Service Worker with Workbox

## Prerequisites

- Node.js (v14 or higher)
- ERPNext instance with REST API enabled
- Customer account in ERPNext

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/erpnext-customer-pwa.git
   cd erpnext-customer-pwa
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your ERPNext API URL:
   ```
   VITE_API_BASE_URL=https://your-erpnext-instance.com/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

```
VITE_API_BASE_URL=https://your-erpnext-instance.com/api
VITE_API_KEY=your_api_key
VITE_API_SECRET=your_api_secret
```

Notes:
- Production: Token-based authentication is recommended. When `VITE_API_KEY` and `VITE_API_SECRET` are set, all API requests include `Authorization: token <key>:<secret>` automatically, and cookie/session handling is disabled.
- Development: If you prefer session/cookie auth via `/method/login`, ensure your ERPNext CORS settings allow credentials and that cookies are set with `SameSite=None; Secure`. This app is configured to support cookie-based sessions in development:
  - Dev server can run over HTTPS and accept LAN connections (for `Secure` cookies).
  - The client automatically sends CSRF via `X-Frappe-CSRF-Token` using the `csrf_token` cookie.
  - All requests include `withCredentials: true` and `X-Requested-With: XMLHttpRequest` when token auth is not configured.

ERPNext server-side requirements for session auth:
- Allow CORS from your dev origin (e.g., `https://192.168.10.90:5173`) and enable credentials.
- Ensure login sets cookies with `SameSite=None; Secure`; cookies should include `sid` and `csrf_token`.
- Non-GET requests to `/api/method` and `/api/resource` should accept `X-Frappe-CSRF-Token`.

### Production Authentication Mode

- Create a `.env.production` file with:

```
VITE_API_BASE_URL=https://your-production-erpnext-instance.com/api
VITE_API_KEY=<service_account_api_key>
VITE_API_SECRET=<service_account_api_secret>
```

- The app will:
  - Use a single ERPNext service account via `Authorization: token <key>:<secret>` for all requests.
  - Bypass `/api/method/login` and `/api/method/logout` calls; UI login only sets local app state.
  - Avoid cookie and CSRF handling (`withCredentials` disabled) since token auth is stateless.

- ERPNext setup:
  - Assign proper roles and permissions to the service account so it can perform required CRUD operations on relevant DocTypes (e.g., Sales Order, Sales Invoice, Item, Item Price, Warehouse, Customer Feedback/Complaint, Sales Return Request).
  - Follow least privilege: only grant necessary DocType permissions.

- Security:
  - Store `VITE_API_KEY` and `VITE_API_SECRET` securely and inject them only in production.
  - Ensure HTTPS is enforced end-to-end.
  - Rotate keys periodically.

If `VITE_API_KEY` and `VITE_API_SECRET` are not set, the app will fall back to session/cookie auth and use `/api/method/login`.

### ERPNext API Setup

Ensure your ERPNext instance has:

1. REST API enabled
2. CORS configured to allow requests from your app's domain
3. Customer doctype with appropriate permissions
4. Required doctypes accessible via API:
   - Sales Order
   - Sales Invoice
   - Item
   - Item Price
   - Warehouse
   - Customer Feedback
   - Customer Complaint
5. (Optional) API Key & Secret for the user who will access the API, if using token authentication

## Deployment

### Build for Production

```bash
npm run build
```

This will generate optimized files in the `dist` directory.

### Deployment Options

#### Option 1: Netlify

1. Create a `netlify.toml` file in the project root:
   ```toml
   [build]
     publish = "dist"
     command = "npm run build"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. Deploy to Netlify:
   ```bash
   npx netlify-cli deploy --prod
   ```

#### Option 2: Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy to Vercel:
   ```bash
   vercel --prod
   ```

#### Option 3: Manual Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload the contents of the `dist` directory to your web server
3. Configure your web server to serve `index.html` for all routes (for SPA routing)
4. Ensure proper HTTPS configuration for PWA features

## PWA Installation

The app can be installed as a PWA on supported devices:

1. Open the app in a supported browser (Chrome, Edge, Safari, etc.)
2. The browser will show an "Add to Home Screen" prompt
3. Alternatively, use the browser menu to "Install" or "Add to Home Screen"

## License

MIT
