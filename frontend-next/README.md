# StyrCan Frontend

Modern, responsive frontend for the StyrCan Business Management Platform built with Next.js 14.

## Features

- **Dashboard**: Real-time business metrics and KPIs
- **Employee Management**: Employee profiles, PTO tracking, shift scheduling
- **Financial Management**: Cash flow monitoring, expense tracking, reporting
- **Payroll Processing**: Automated payroll, tax deductions, pay stubs
- **Messaging System**: Real-time team communication
- **Notifications**: Stay updated with business activities
- **Settings**: User profile, company settings, preferences

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.4
- **Styling**: Tailwind CSS 3.4
- **UI Components**: shadcn/ui + Radix UI
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the environment file:

   ```bash
   cp .env.example .env.local
   ```

4. Update the environment variables in `.env.local`

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages (login, register)
│   ├── (dashboard)/       # Dashboard pages (protected)
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── providers.tsx      # Context providers
├── components/
│   └── ui/                # Reusable UI components
├── lib/
│   ├── api/               # API client
│   └── utils.ts           # Utility functions
├── stores/                # Zustand stores
└── types/                 # TypeScript types
```

## Docker

Build and run with Docker:

```bash
docker build -t styrcan-frontend .
docker run -p 3000:3000 styrcan-frontend
```

Or use Docker Compose from the project root:

```bash
docker-compose up frontend
```

## Environment Variables

| Variable               | Description      | Default                        |
| ---------------------- | ---------------- | ------------------------------ |
| `NEXT_PUBLIC_API_URL`  | Backend API URL  | `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `StyrCan`                      |
| `NEXT_PUBLIC_APP_URL`  | Frontend URL     | `http://localhost:3000`        |

## License

Proprietary - All rights reserved.
