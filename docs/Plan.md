# Technical Architecture

This document provides a comprehensive overview of StyrCan's technical stack, project structure, and architectural decisions.

---

## Table of Contents

- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Path Aliases](#path-aliases)
- [Component Architecture](#component-architecture)
- [Build Configuration](#build-configuration)
- [Dependencies](#dependencies)

---

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI component library |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Vite** | 5.x | Build tool and dev server |
| **Tailwind CSS** | 3.4.x | Utility-first CSS framework |

### UI & Styling

| Technology | Purpose |
|------------|---------|
| **shadcn/ui** | Pre-built accessible UI components |
| **Radix UI** | Unstyled, accessible component primitives |
| **Lucide React** | Modern icon library |
| **tailwindcss-animate** | Animation utilities for Tailwind |
| **class-variance-authority** | Component variant management |
| **tailwind-merge** | Intelligent Tailwind class merging |
| **clsx** | Conditional className utility |

### State & Data Management

| Technology | Purpose |
|------------|---------|
| **TanStack React Query** | Server state management and caching |
| **React Router DOM** | Client-side routing |
| **React Hook Form** | Performant form handling |
| **Zod** | Schema validation |

### Utilities

| Technology | Purpose |
|------------|---------|
| **date-fns** | Date manipulation utilities |
| **Recharts** | Charting and data visualization |
| **Sonner** | Toast notifications |
| **Embla Carousel** | Carousel/slider functionality |

---

## Project Structure

```
styrcan/
├── public/                     # Static assets
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── src/
│   ├── assets/                 # Images and media
│   │   └── hero-dashboard.jpg
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui base components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   └── ...
│   │   ├── Header.tsx          # Page header component
│   │   ├── Hero.tsx            # Hero section component
│   │   ├── Features.tsx        # Features section component
│   │   ├── Benefits.tsx        # Benefits section component
│   │   └── Footer.tsx          # Page footer component
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── lib/                    # Utility functions
│   │   └── utils.ts
│   ├── pages/                  # Page components
│   │   ├── Index.tsx           # Main landing page
│   │   └── NotFound.tsx        # 404 page
│   ├── App.tsx                 # Root application component
│   ├── App.css                 # Global styles
│   ├── index.css               # Design system tokens
│   ├── main.tsx                # Application entry point
│   └── vite-env.d.ts           # Vite type definitions
├── docs/                       # Documentation
│   ├── README.md
│   ├── TECHNICAL_ARCHITECTURE.md
│   ├── DESIGN_SYSTEM.md
│   ├── COMPONENTS.md
│   └── DEVELOPMENT_GUIDE.md
├── .lovable/                   # Lovable configuration
│   └── plan.md
├── components.json             # shadcn/ui configuration
├── eslint.config.js            # ESLint configuration
├── index.html                  # HTML entry point
├── package.json                # Dependencies and scripts
├── postcss.config.js           # PostCSS configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── tsconfig.app.json           # App-specific TS config
├── tsconfig.node.json          # Node-specific TS config
└── vite.config.ts              # Vite configuration
```

---

## Path Aliases

The project uses TypeScript path aliases for cleaner imports:

```typescript
// Instead of relative imports
import { Button } from "../../../components/ui/button";

// Use path aliases
import { Button } from "@/components/ui/button";
```

### Configuration (vite.config.ts)

```typescript
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### Configuration (tsconfig.app.json)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## Component Architecture

### Layer Structure

```
┌─────────────────────────────────────────┐
│              Pages (Index.tsx)          │  ← Route-level components
├─────────────────────────────────────────┤
│    Section Components (Hero, Features)  │  ← Page section compositions
├─────────────────────────────────────────┤
│       UI Components (Button, Card)      │  ← Reusable primitives
├─────────────────────────────────────────┤
│         Utilities (cn, utils)           │  ← Helper functions
└─────────────────────────────────────────┘
```

### Component Patterns

#### UI Components (src/components/ui/)
- Built on Radix UI primitives
- Use `class-variance-authority` for variants
- Accept `className` prop for customization
- Forward refs for DOM access

```typescript
// Example: Button with variants
const buttonVariants = cva(
  "inline-flex items-center justify-center...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        hero: "bg-gradient-primary text-primary-foreground",
        // ...
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
  }
);
```

#### Section Components (src/components/)
- Compose UI components
- Contain layout and content logic
- Use semantic design tokens
- Implement responsive patterns

#### Page Components (src/pages/)
- Route-level composition
- Arrange section components
- Handle page-level state

---

## Build Configuration

### Vite Configuration (vite.config.ts)

```typescript
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
```

### Key Features
- **SWC**: Fast Rust-based React compiler
- **Hot Module Replacement**: Instant updates during development
- **Path Aliasing**: Clean import paths via `@/` prefix
- **Component Tagging**: Development-only component identification

---

## Dependencies

### Production Dependencies

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.30.1",
  "@tanstack/react-query": "^5.83.0",
  "@radix-ui/react-*": "^1.x",
  "tailwind-merge": "^2.6.0",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "lucide-react": "^0.462.0",
  "date-fns": "^3.6.0",
  "recharts": "^2.15.4",
  "sonner": "^1.7.4",
  "zod": "^3.25.76",
  "react-hook-form": "^7.61.1"
}
```

### Development Dependencies

- **Vite**: Build tooling
- **TypeScript**: Type checking
- **ESLint**: Code linting
- **Tailwind CSS**: Styling utilities
- **PostCSS**: CSS processing

---

## Performance Considerations

### Bundle Optimization
- Tree-shaking enabled by default
- Code splitting via dynamic imports
- Optimized chunk strategy for vendor libraries

### Runtime Performance
- React Query caching reduces network requests
- Tailwind CSS purges unused styles in production
- Lazy loading for non-critical components

### Development Experience
- Fast HMR with Vite
- TypeScript for compile-time error checking
- ESLint for code quality enforcement

---

## Related Documentation

- [Design System](./DESIGN_SYSTEM.md) - Visual design tokens and patterns
- [Components](./COMPONENTS.md) - Component library reference
- [Development Guide](./DEVELOPMENT_GUIDE.md) - Setup and conventions
-------------------------------------------------------------------------------------------------------
# StyrCan Documentation

> **Empowering Small Businesses with One Integrated Platform**

Welcome to the official documentation for StyrCan, a next-generation business management platform designed to simplify and streamline operations for small businesses.

---

## Table of Contents

- [Overview](#overview)
- [Core Functionalities](#core-functionalities)
- [Problems We Solve](#problems-we-solve)
- [Value Proposition](#value-proposition)
- [Getting Started](#getting-started)
- [Documentation Index](#documentation-index)

---

## Overview

Running a small business often involves managing scattered tools for payroll, financial tracking, employee schedules, internal communication, and more. This fragmentation leads to inefficiencies, higher costs, and wasted time.

**StyrCan** solves this problem by offering an all-in-one platform that centralizes these functionalities, enabling business owners to focus on what truly matters: **growth and success**.

Whether you're a small business owner managing a team or a solo entrepreneur handling multiple responsibilities, StyrCan is built to support your needs with simplicity, efficiency, and reliability.

---

## Core Functionalities

### 1. Employee Management
- **Employee Profiles**: Add and manage employee details in one place
- **PTO Tracking**: Monitor employee leave balances and requests
- **Shift Scheduling**: Easily assign or adjust shifts for employees
- **Performance Insights**: Track attendance and generate reports on employee performance

### 2. Financial Management
- **Cash Flow Monitoring**: Keep track of income and expenses in real time
- **Expense Tracking**: Record and categorize all business expenses
- **Financial Reporting**: Generate detailed reports to make data-driven decisions
- **Tax Compliance Tools**: Simplify tax planning with automated calculations

### 3. Payroll Processing
- **Automated Payroll**: Calculate salaries automatically based on hours, overtime, bonuses, and deductions
- **Tax Deductions**: Manage local taxes and compliance requirements seamlessly
- **Payment Tracking**: Track payment statuses for each employee
- **Payroll Reports**: Generate detailed payroll reports for recordkeeping and compliance

### 4. Team Communication
- **Direct Messaging**: Employees can send private messages to colleagues or administrators
- **Broadcast Announcements**: Administrators can send company-wide announcements or updates
- **Messaging Dashboard**: View recent conversations in an organized interface
- **Real-Time Notifications**: Receive instant alerts for new messages or announcements

### 5. Centralized Dashboard
- **Real-Time Analytics**: Gain insights into key metrics like revenue, employee performance, payroll summaries, and operational efficiency
- **Customizable Widgets**: Tailor the dashboard to display the information that matters most to your business

### 6. Operational Efficiency
- **Business Registration Support**: Simplify the process of registering your business
- **Document Management**: Securely store and access important business documents
- **Automation Tools**: Automate repetitive tasks like payroll processing and invoicing

---

## Problems We Solve

| Problem | How StyrCan Solves It |
|---------|----------------------|
| **Fragmented Tools** | One unified platform replaces 5+ separate software subscriptions |
| **Payroll Complexity** | Automated salary calculations with built-in tax compliance |
| **Communication Gaps** | Integrated messaging ensures seamless team collaboration |
| **Lack of Insights** | Real-time analytics dashboard for data-driven decisions |
| **Time Constraints** | Automation saves 15+ hours per week on administrative tasks |
| **Scalability Issues** | Built to grow from startup to enterprise |

---

## Value Proposition

### Why Choose StyrCan?

- **Ease of Use**: Intuitive design ensures minimal learning curve
- **Cost Efficiency**: Reduces software costs by up to 70%
- **Scalability**: Built to adapt as your business grows
- **Cloud-Based**: Access your data securely from anywhere using any device
- **Data Security**: Enterprise-grade encryption with SOC 2 certification
- **24/7 Support**: Round-the-clock customer support
- **99.9% Uptime**: Reliable infrastructure you can count on

### Average Results (First 3 Months)

| Metric | Result |
|--------|--------|
| Cost Reduction | 70% |
| Time Saved Weekly | 15+ hours |
| Payroll Accuracy | 99% |
| User Rating | 4.9★ |

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm (or bun)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Quick Start

```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd styrcan

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality |

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [Technical Architecture](./TECHNICAL_ARCHITECTURE.md) | Technology stack, project structure, and build configuration |
| [Design System](./DESIGN_SYSTEM.md) | Colors, typography, gradients, shadows, and design tokens |
| [Components](./COMPONENTS.md) | Page components, UI library, and usage patterns |
| [Development Guide](./DEVELOPMENT_GUIDE.md) | Setup instructions, conventions, and best practices |

---

## Future Enhancements

- Advanced Customer Relationship Management (CRM) tools
- Inventory management for product-based businesses
- Marketing automation features
- Integration with third-party services (payment gateways, social media)
- Native mobile app support for on-the-go management

---

## Support

- **Email**: hello@styrcan.com
- **Phone**: 1-800-STYRCAN
- **Location**: San Francisco, CA

---

*StyrCan is more than just software—it's a partner in your business's success.*
------------------------------------------------------------------------------------------------------------------------------------------------
# Development Guide

This guide covers everything you need to set up, develop, and contribute to the StyrCan application.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Conventions](#code-conventions)
- [Component Development](#component-development)
- [Styling Guidelines](#styling-guidelines)
- [Best Practices](#best-practices)

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 18.x or higher | JavaScript runtime |
| npm or bun | Latest | Package manager |
| Git | Latest | Version control |

### Recommended Extensions (VS Code)

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Tailwind CSS IntelliSense** - Tailwind autocomplete
- **TypeScript Importer** - Auto-import TypeScript modules

---

## Getting Started

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd styrcan

# Install dependencies
npm install
# or
bun install
```

### Development Server

```bash
# Start the development server
npm run dev
# or
bun run dev
```

The application will be available at `http://localhost:8080`

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start development server with HMR |
| `build` | `npm run build` | Build for production |
| `preview` | `npm run preview` | Preview production build |
| `lint` | `npm run lint` | Run ESLint |

---

## Development Workflow

### Branch Strategy

```
main           # Production-ready code
├── develop    # Integration branch
│   ├── feature/employee-management
│   ├── feature/payroll-dashboard
│   └── fix/mobile-navigation
```

### Commit Messages

Follow conventional commits:

```
feat: add employee profile component
fix: resolve mobile menu toggle issue
docs: update component documentation
style: format button component
refactor: simplify form validation logic
```

### Pull Request Process

1. Create feature branch from `develop`
2. Make changes and commit
3. Open PR against `develop`
4. Ensure all checks pass
5. Request review
6. Merge after approval

---

## Code Conventions

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `EmployeeCard.tsx` |
| Hooks | camelCase with `use` prefix | `useEmployee.ts` |
| Utilities | camelCase | `formatCurrency.ts` |
| Types | PascalCase | `Employee.types.ts` |
| Constants | SCREAMING_SNAKE_CASE | `API_ENDPOINTS.ts` |

### Directory Structure

```
src/
├── components/
│   ├── ui/              # Base UI components (shadcn)
│   ├── forms/           # Form-specific components
│   ├── layout/          # Layout components
│   └── [Feature].tsx    # Feature components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── pages/               # Route-level components
├── types/               # TypeScript type definitions
└── assets/              # Images, fonts, etc.
```

### Import Order

```typescript
// 1. React and core libraries
import React, { useState, useEffect } from "react";

// 2. Third-party libraries
import { useQuery } from "@tanstack/react-query";

// 3. Internal components (absolute imports)
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// 4. Hooks
import { useEmployee } from "@/hooks/useEmployee";

// 5. Types
import type { Employee } from "@/types/employee";

// 6. Utilities
import { cn } from "@/lib/utils";

// 7. Assets
import heroImage from "@/assets/hero-dashboard.jpg";
```

---

## Component Development

### Component Template

```tsx
import { cn } from "@/lib/utils";

interface ComponentProps {
  /** Description of the prop */
  title: string;
  /** Optional className for customization */
  className?: string;
  /** Children elements */
  children?: React.ReactNode;
}

const Component = ({ title, className, children }: ComponentProps) => {
  return (
    <div className={cn("base-styles", className)}>
      <h2>{title}</h2>
      {children}
    </div>
  );
};

export default Component;
```

### Using Variants (CVA)

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const componentVariants = cva(
  // Base styles
  "inline-flex items-center justify-center rounded-md",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline: "border border-input bg-background",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3",
        lg: "h-12 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof componentVariants> {}

const Component = ({ variant, size, className, ...props }: ComponentProps) => {
  return (
    <div
      className={cn(componentVariants({ variant, size, className }))}
      {...props}
    />
  );
};
```

### Forwarding Refs

```tsx
import * as React from "react";

const Component = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("styles", className)} {...props} />
));
Component.displayName = "Component";

export { Component };
```

---

## Styling Guidelines

### Tailwind Best Practices

#### ✅ Do

```tsx
// Use semantic design tokens
<div className="bg-primary text-primary-foreground" />

// Use responsive prefixes
<div className="text-sm md:text-base lg:text-lg" />

// Use transition utilities
<button className="hover:bg-primary/90 transition-smooth" />

// Group related utilities
<div className="flex items-center justify-between gap-4" />
```

#### ❌ Don't

```tsx
// Hardcoded colors
<div className="bg-blue-500 text-white" />

// Inline styles
<div style={{ backgroundColor: "#3b82f6" }} />

// Missing transitions on interactive elements
<button className="hover:bg-primary/90" />
```

### Using the `cn` Utility

The `cn` function merges Tailwind classes intelligently:

```tsx
import { cn } from "@/lib/utils";

// Basic usage
cn("px-4 py-2", "bg-primary")  // "px-4 py-2 bg-primary"

// Conditional classes
cn("base-class", isActive && "active-class")

// Override classes
cn("px-4", className)  // className can override px-4

// With objects
cn("base", { "active": isActive, "disabled": isDisabled })
```

### Custom CSS

When Tailwind utilities aren't sufficient, add custom CSS in `src/index.css`:

```css
@layer components {
  .custom-pattern {
    @apply relative overflow-hidden;
    background-image: url('/pattern.svg');
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

---

## Best Practices

### Performance

1. **Use React Query for data fetching**
   ```tsx
   const { data, isLoading } = useQuery({
     queryKey: ['employees'],
     queryFn: fetchEmployees,
   });
   ```

2. **Lazy load heavy components**
   ```tsx
   const HeavyChart = React.lazy(() => import('./HeavyChart'));
   ```

3. **Memoize expensive calculations**
   ```tsx
   const sortedData = useMemo(() => 
     data.sort((a, b) => a.name.localeCompare(b.name)),
     [data]
   );
   ```

### Accessibility

1. **Use semantic HTML**
   ```tsx
   <nav aria-label="Main navigation">
   <main>
   <section aria-labelledby="features-heading">
   ```

2. **Include alt text for images**
   ```tsx
   <img src={heroImage} alt="StyrCan dashboard preview" />
   ```

3. **Ensure keyboard navigation**
   - All interactive elements are focusable
   - Focus states are visible
   - Tab order is logical

### Type Safety

1. **Define explicit types**
   ```tsx
   interface Employee {
     id: string;
     name: string;
     email: string;
     role: 'admin' | 'manager' | 'employee';
   }
   ```

2. **Use type guards**
   ```tsx
   function isEmployee(obj: unknown): obj is Employee {
     return typeof obj === 'object' && obj !== null && 'id' in obj;
   }
   ```

3. **Avoid `any`**
   ```tsx
   // ❌ Avoid
   const data: any = fetchData();
   
   // ✅ Prefer
   const data: Employee[] = fetchData();
   ```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Port 8080 in use | Kill the process or change port in `vite.config.ts` |
| TypeScript errors | Run `npm run lint` to identify issues |
| Styles not updating | Clear browser cache, restart dev server |
| Import errors | Check path aliases in `tsconfig.json` |

### Getting Help

1. Check existing documentation
2. Search for similar issues in the codebase
3. Consult the team for guidance

---

## Related Documentation

- [README](./README.md) - Project overview
- [Technical Architecture](./TECHNICAL_ARCHITECTURE.md) - Tech stack details
- [Design System](./DESIGN_SYSTEM.md) - Visual design tokens
- [Components](./COMPONENTS.md) - Component library reference
----------------------------------------------------------------------------------------------------------------------
# Design System

This document defines StyrCan's complete design system, including colors, typography, spacing, shadows, animations, and visual patterns.

---

## Table of Contents

- [Color Palette](#color-palette)
- [Gradients](#gradients)
- [Shadows](#shadows)
- [Typography](#typography)
- [Spacing & Border Radius](#spacing--border-radius)
- [Animations & Transitions](#animations--transitions)
- [Dark Mode](#dark-mode)
- [Usage Guidelines](#usage-guidelines)

---

## Color Palette

All colors are defined using HSL format for consistency and theme flexibility.

### Brand Colors

| Token | HSL Value | Description | Usage |
|-------|-----------|-------------|-------|
| `--primary` | `221 83% 53%` | Professional Blue | Primary actions, links, focus states |
| `--primary-foreground` | `0 0% 98%` | White | Text on primary backgrounds |
| `--primary-light` | `221 83% 63%` | Light Blue | Hover states, accents |
| `--primary-dark` | `221 83% 43%` | Dark Blue | Active states, emphasis |
| `--secondary` | `262 83% 58%` | Trust Purple | Secondary actions, badges |
| `--secondary-foreground` | `0 0% 98%` | White | Text on secondary backgrounds |
| `--secondary-light` | `262 83% 68%` | Light Purple | Hover states |

### Status Colors

| Token | HSL Value | Description | Usage |
|-------|-----------|-------------|-------|
| `--success` | `142 76% 36%` | Green | Success states, positive indicators |
| `--success-foreground` | `0 0% 98%` | White | Text on success backgrounds |
| `--warning` | `38 92% 50%` | Orange/Amber | Warning states, caution indicators |
| `--warning-foreground` | `0 0% 98%` | White | Text on warning backgrounds |
| `--destructive` | `0 84% 60%` | Red | Error states, destructive actions |
| `--destructive-foreground` | `0 0% 98%` | White | Text on destructive backgrounds |

### Neutral Colors

| Token | HSL Value | Description | Usage |
|-------|-----------|-------------|-------|
| `--background` | `250 100% 99%` | Near White | Page background |
| `--foreground` | `224 71% 4%` | Near Black | Primary text |
| `--card` | `0 0% 100%` | White | Card backgrounds |
| `--card-foreground` | `224 71% 4%` | Near Black | Card text |
| `--muted` | `220 14% 96%` | Light Gray | Muted backgrounds |
| `--muted-foreground` | `220 8.9% 46.1%` | Medium Gray | Secondary text |
| `--accent` | `220 14% 96%` | Light Gray | Accent backgrounds |
| `--accent-foreground` | `224 71% 4%` | Near Black | Accent text |
| `--border` | `220 13% 91%` | Light Gray | Borders, dividers |
| `--input` | `220 13% 91%` | Light Gray | Input borders |
| `--ring` | `221 83% 53%` | Primary Blue | Focus rings |

### Sidebar Colors

| Token | HSL Value | Description |
|-------|-----------|-------------|
| `--sidebar-background` | `224 71% 4%` | Dark background |
| `--sidebar-foreground` | `0 0% 98%` | Light text |
| `--sidebar-primary` | `221 83% 53%` | Blue accents |
| `--sidebar-accent` | `224 71% 14%` | Dark accent |
| `--sidebar-border` | `224 71% 14%` | Dark border |

---

## Gradients

### Gradient Definitions

```css
/* Primary Brand Gradient - Blue to Purple */
--gradient-primary: linear-gradient(135deg, hsl(221 83% 53%) 0%, hsl(262 83% 58%) 100%);

/* Secondary Gradient - Purple to Magenta */
--gradient-secondary: linear-gradient(135deg, hsl(262 83% 58%) 0%, hsl(291 64% 42%) 100%);

/* Subtle Background Gradient */
--gradient-subtle: linear-gradient(135deg, hsl(250 100% 99%) 0%, hsl(220 14% 96%) 100%);

/* Card Background Gradient */
--gradient-card: linear-gradient(135deg, hsl(0 0% 100%) 0%, hsl(220 14% 98%) 100%);
```

### Tailwind Usage

```tsx
// Apply via Tailwind classes
<div className="bg-gradient-primary" />
<div className="bg-gradient-secondary" />
<div className="bg-gradient-subtle" />
<div className="bg-gradient-card" />

// Gradient text
<span className="bg-gradient-primary bg-clip-text text-transparent">
  Gradient Text
</span>
```

---

## Shadows

### Shadow Tokens

```css
/* Small shadow - subtle elevation */
--shadow-sm: 0 1px 2px 0 hsl(221 83% 53% / 0.05);

/* Medium shadow - cards, dropdowns */
--shadow-md: 0 4px 6px -1px hsl(221 83% 53% / 0.1), 
             0 2px 4px -1px hsl(221 83% 53% / 0.06);

/* Large shadow - modals, popovers */
--shadow-lg: 0 10px 15px -3px hsl(221 83% 53% / 0.1), 
             0 4px 6px -2px hsl(221 83% 53% / 0.05);

/* Extra large shadow - prominent elements */
--shadow-xl: 0 20px 25px -5px hsl(221 83% 53% / 0.1), 
             0 10px 10px -5px hsl(221 83% 53% / 0.04);

/* Card shadow - default card elevation */
--shadow-card: 0 4px 12px hsl(221 83% 53% / 0.08);

/* Card hover shadow - interactive card states */
--shadow-card-hover: 0 8px 20px hsl(221 83% 53% / 0.12);
```

### Tailwind Usage

```tsx
<Card className="shadow-card" />
<Card className="hover:shadow-card-hover transition-smooth" />
<div className="shadow-business" />  // Uses --shadow-lg
```

---

## Typography

### Font Stack

The application uses the system font stack for optimal performance:

```css
font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 
             "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

### Font Sizes (Tailwind defaults)

| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 0.75rem (12px) | Badges, labels |
| `text-sm` | 0.875rem (14px) | Secondary text, captions |
| `text-base` | 1rem (16px) | Body text |
| `text-lg` | 1.125rem (18px) | Lead paragraphs |
| `text-xl` | 1.25rem (20px) | Card titles |
| `text-2xl` | 1.5rem (24px) | Section headings |
| `text-3xl` | 1.875rem (30px) | Large headings |
| `text-4xl` | 2.25rem (36px) | Page titles |
| `text-5xl` | 3rem (48px) | Hero headings |
| `text-6xl` | 3.75rem (60px) | Large hero text |

### Font Weights

| Class | Weight | Usage |
|-------|--------|-------|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Navigation, labels |
| `font-semibold` | 600 | Card titles, emphasis |
| `font-bold` | 700 | Headings, CTAs |

---

## Spacing & Border Radius

### Border Radius Tokens

```css
--radius: 0.75rem;  /* 12px - Base radius */
```

### Tailwind Classes

| Class | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | `calc(var(--radius) - 4px)` | Small elements |
| `rounded-md` | `calc(var(--radius) - 2px)` | Inputs, buttons |
| `rounded-lg` | `var(--radius)` | Cards, containers |
| `rounded-xl` | `1rem` | Large cards |
| `rounded-2xl` | `1.5rem` | Hero sections |
| `rounded-full` | `9999px` | Avatars, badges |

### Spacing Scale

Tailwind's default spacing scale is used:
- `4` = 1rem (16px)
- `6` = 1.5rem (24px)
- `8` = 2rem (32px)
- `12` = 3rem (48px)
- `16` = 4rem (64px)
- `24` = 6rem (96px)

---

## Animations & Transitions

### Transition Tokens

```css
/* Smooth transition - standard interactions */
--transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Spring transition - playful, bouncy feel */
--transition-spring: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

### Tailwind Usage

```tsx
// Standard smooth transitions
<button className="transition-smooth hover:bg-primary/90" />

// Spring animation for prominent elements
<Button variant="hero" className="transition-spring" />
```

### Keyframe Animations

```css
/* Accordion animations */
@keyframes accordion-down {
  from { height: 0; }
  to { height: var(--radix-accordion-content-height); }
}

@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height); }
  to { height: 0; }
}
```

---

## Dark Mode

Dark mode is fully supported via the `.dark` class on the root element.

### Dark Mode Tokens

| Token | Light Value | Dark Value |
|-------|-------------|------------|
| `--background` | `250 100% 99%` | `224 71% 4%` |
| `--foreground` | `224 71% 4%` | `0 0% 98%` |
| `--card` | `0 0% 100%` | `224 71% 6%` |
| `--muted` | `220 14% 96%` | `224 71% 14%` |
| `--border` | `220 13% 91%` | `224 71% 14%` |

### Implementation

```tsx
// Tailwind config
module.exports = {
  darkMode: ["class"],
  // ...
}

// Toggle dark mode
document.documentElement.classList.toggle("dark");
```

---

## Usage Guidelines

### Do's ✅

1. **Use semantic tokens**: Always use CSS variables instead of raw colors
   ```tsx
   // ✅ Correct
   <div className="bg-primary text-primary-foreground" />
   
   // ❌ Incorrect
   <div className="bg-blue-500 text-white" />
   ```

2. **Use transition utilities**: Apply smooth transitions for interactions
   ```tsx
   <button className="hover:shadow-card-hover transition-smooth" />
   ```

3. **Use gradient classes**: Apply gradients via Tailwind utilities
   ```tsx
   <div className="bg-gradient-primary" />
   ```

4. **Maintain contrast**: Ensure text is readable on all backgrounds
   ```tsx
   <div className="bg-primary text-primary-foreground" />
   ```

### Don'ts ❌

1. **Don't use hardcoded colors**: This breaks theming
   ```tsx
   // ❌ Avoid
   <div style={{ backgroundColor: "#3b82f6" }} />
   ```

2. **Don't skip transitions**: Abrupt changes feel jarring
   ```tsx
   // ❌ Avoid
   <button className="hover:bg-primary/90" />  // Missing transition
   
   // ✅ Correct
   <button className="hover:bg-primary/90 transition-smooth" />
   ```

3. **Don't mix color systems**: Stick to HSL-based tokens

---

## Related Documentation

- [Components](./COMPONENTS.md) - Component library reference
- [Technical Architecture](./TECHNICAL_ARCHITECTURE.md) - Tech stack details
- [Development Guide](./DEVELOPMENT_GUIDE.md) - Setup and conventions
---------------------------------------------------------------------------------

# Component Reference

This document provides a comprehensive reference for all components in the StyrCan application, including usage patterns, props, and styling conventions.

---

## Table of Contents

- [Page Components](#page-components)
- [UI Component Library](#ui-component-library)
- [Icon Usage](#icon-usage)
- [Styling Conventions](#styling-conventions)

---

## Page Components

### Header (`src/components/Header.tsx`)

The main navigation header with responsive mobile menu.

#### Features
- Sticky positioning with blur backdrop
- Desktop navigation with links and CTAs
- Mobile hamburger menu with animated toggle
- Brand logo with gradient styling

#### Structure
```tsx
<header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
  {/* Logo */}
  {/* Desktop Navigation */}
  {/* Mobile Menu Button */}
  {/* Mobile Menu (conditional) */}
</header>
```

#### Key Elements
| Element | Description |
|---------|-------------|
| Logo | Building2 icon with gradient background |
| Nav Links | Features, Solutions, Pricing |
| CTA Buttons | Sign In (outline), Get Started (hero) |
| Mobile Toggle | Menu/X icon with state management |

---

### Hero (`src/components/Hero.tsx`)

The main landing section with headline, CTAs, and dashboard preview.

#### Features
- Trust badge with star ratings
- Gradient headline text
- Dual CTA buttons (primary and secondary)
- Stats bar (Uptime, Support, Certification)
- Dashboard preview image with floating elements

#### Structure
```tsx
<section className="pt-20 pb-32 bg-gradient-subtle">
  <div className="grid lg:grid-cols-2 gap-16 items-center">
    {/* Left: Content */}
    {/* Right: Dashboard Image */}
  </div>
</section>
```

#### Key Elements
| Element | Styling |
|---------|---------|
| Trust Badge | Star icons with `fill-warning text-warning` |
| Headline | `text-5xl lg:text-6xl font-bold` |
| Gradient Text | `bg-gradient-primary bg-clip-text text-transparent` |
| Hero CTA | `variant="hero"` with arrow icon |
| Secondary CTA | `variant="business"` with play icon |
| Stats Grid | 3-column grid with `text-primary` numbers |
| Dashboard Image | Rounded container with gradient overlay |

---

### Features (`src/components/Features.tsx`)

Showcases the platform's core features in a card grid.

#### Features
- Section header with badge
- 6 main feature cards with icons and highlights
- 3 additional feature items

#### Main Features Data
| Feature | Icon | Badge |
|---------|------|-------|
| Employee Management | Users | Core Feature |
| Financial Management | DollarSign | Essential |
| Payroll Processing | Calendar | Automated |
| Team Communication | MessageSquare | Real-time |
| Analytics Dashboard | BarChart3 | Intelligence |
| Security & Compliance | Shield | Enterprise |

#### Card Structure
```tsx
<Card className="p-8 hover:shadow-card-hover transition-smooth border-border bg-gradient-card group">
  {/* Icon & Badge row */}
  {/* Title & Description */}
  {/* Highlights list */}
</Card>
```

#### Styling Patterns
- Icon containers: `p-3 bg-gradient-primary rounded-lg group-hover:scale-110`
- Highlight bullets: `w-1.5 h-1.5 bg-primary rounded-full`
- Additional features: `bg-muted/50 hover:bg-muted`

---

### Benefits (`src/components/Benefits.tsx`)

Presents problems and solutions with social proof.

#### Features
- Problem/Solution cards (4 items)
- Benefits checklist with icons
- Stats card with testimonial
- CTA button

#### Problem Cards Data
| Problem | Icon |
|---------|------|
| Fragmented Tools | Puzzle |
| Time Wasted | Clock |
| Hidden Costs | DollarSign |
| Growth Limitations | TrendingUp |

#### Stats Card Metrics
| Metric | Value | Color |
|--------|-------|-------|
| Cost Reduction | 70% | `text-success` |
| Time Saved | 15hrs | `text-primary` |
| Payroll Accuracy | 99% | `text-secondary` |
| User Rating | 4.9★ | `text-warning` |

---

### Footer (`src/components/Footer.tsx`)

Site footer with navigation, contact info, and newsletter.

#### Sections
| Section | Content |
|---------|---------|
| Company Info | Logo, description, contact details |
| Product | Features, Pricing, Integrations, Security, API |
| Resources | Help Center, Blog, Guides, Webinars, Status |
| Company | About, Careers, Contact, Partners, Press |
| Newsletter | Email input with subscribe button |
| Legal | Privacy, Terms, Cookies, Copyright |

#### Styling
- Background: `bg-sidebar text-sidebar-foreground`
- Links: `text-sidebar-foreground/80 hover:text-sidebar-foreground`
- Border: `border-sidebar-accent`

---

## UI Component Library

### Button (`src/components/ui/button.tsx`)

Versatile button component with multiple variants and sizes.

#### Variants

| Variant | Description | Styling |
|---------|-------------|---------|
| `default` | Standard primary button | `bg-primary text-primary-foreground` |
| `destructive` | Danger/delete actions | `bg-destructive text-destructive-foreground` |
| `outline` | Bordered button | `border border-input bg-background` |
| `secondary` | Secondary actions | `bg-secondary text-secondary-foreground` |
| `ghost` | Minimal button | Transparent with hover state |
| `link` | Text link style | Underline on hover |
| `hero` | Primary CTA | `bg-gradient-primary shadow-card` with spring animation |
| `business` | Secondary CTA | `bg-card border` with hover shadow |
| `success` | Positive action | `bg-success text-success-foreground` |

#### Sizes

| Size | Dimensions |
|------|------------|
| `default` | `h-10 px-4 py-2` |
| `sm` | `h-9 px-3` |
| `lg` | `h-11 px-8` |
| `icon` | `h-10 w-10` |

#### Usage
```tsx
import { Button } from "@/components/ui/button";

<Button variant="hero" size="lg">
  Get Started
</Button>

<Button variant="outline" size="sm">
  Learn More
</Button>
```

---

### Card (`src/components/ui/card.tsx`)

Container component for grouped content.

#### Sub-components
| Component | Purpose |
|-----------|---------|
| `Card` | Main container |
| `CardHeader` | Top section (title area) |
| `CardTitle` | Heading text |
| `CardDescription` | Subtitle/description |
| `CardContent` | Main content area |
| `CardFooter` | Bottom section (actions) |

#### Usage
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

<Card className="hover:shadow-card-hover transition-smooth">
  <CardHeader>
    <CardTitle>Feature Title</CardTitle>
    <CardDescription>Feature description text</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content here */}
  </CardContent>
</Card>
```

---

### Badge (`src/components/ui/badge.tsx`)

Small label component for tags and status indicators.

#### Variants
- `default` - Primary background
- `secondary` - Secondary background
- `outline` - Bordered style
- `destructive` - Error/warning style

#### Usage
```tsx
import { Badge } from "@/components/ui/badge";

<Badge variant="secondary">Core Feature</Badge>
<Badge variant="outline">New</Badge>
```

---

### Input (`src/components/ui/input.tsx`)

Text input field with consistent styling.

#### Styling
```tsx
<Input 
  type="email" 
  placeholder="Enter your email"
  className="flex-1"
/>
```

#### Base Classes
- Height: `h-10`
- Border: `border border-input`
- Focus: `focus-visible:ring-2 focus-visible:ring-ring`
- Disabled: `disabled:cursor-not-allowed disabled:opacity-50`

---

## Icon Usage

The application uses **Lucide React** for all icons.

### Common Icons

| Icon | Import | Usage |
|------|--------|-------|
| `Building2` | `lucide-react` | Brand logo |
| `Users` | `lucide-react` | Employee management |
| `DollarSign` | `lucide-react` | Financial features |
| `Calendar` | `lucide-react` | Scheduling/payroll |
| `MessageSquare` | `lucide-react` | Communication |
| `BarChart3` | `lucide-react` | Analytics |
| `Shield` | `lucide-react` | Security |
| `ArrowRight` | `lucide-react` | CTA arrows |
| `CheckCircle2` | `lucide-react` | Checkmarks |
| `Star` | `lucide-react` | Ratings |
| `Menu` / `X` | `lucide-react` | Mobile menu toggle |

### Icon Styling

```tsx
// Standard icon
<Users className="w-6 h-6 text-primary" />

// Icon in gradient container
<div className="p-3 bg-gradient-primary rounded-lg">
  <Users className="w-8 h-8 text-primary-foreground" />
</div>

// Filled icon
<Star className="w-4 h-4 fill-warning text-warning" />
```

---

## Styling Conventions

### Layout Patterns

```tsx
// Container with padding
<div className="container mx-auto px-6">

// Section padding
<section className="py-24">

// Grid layouts
<div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">

// Flex layouts
<div className="flex items-center justify-between">
```

### Responsive Patterns

```tsx
// Breakpoint prefixes
<h1 className="text-4xl lg:text-5xl xl:text-6xl">

// Hidden/shown at breakpoints
<nav className="hidden md:flex">
<div className="md:hidden">

// Grid column changes
<div className="grid md:grid-cols-2 xl:grid-cols-4">
```

### Interactive States

```tsx
// Hover with transition
<Card className="hover:shadow-card-hover transition-smooth">

// Group hover (parent triggers child)
<div className="group">
  <div className="group-hover:scale-110 transition-transform">
</div>

// Focus states (handled by Radix/shadcn)
```

### Color Usage

```tsx
// Semantic colors only
<div className="text-primary">
<div className="bg-muted">
<div className="border-border">

// Status colors
<span className="text-success">Positive</span>
<span className="text-destructive">Error</span>
<span className="text-warning">Warning</span>

// Gradient text
<span className="bg-gradient-primary bg-clip-text text-transparent">
```

---

## Related Documentation

- [Design System](./DESIGN_SYSTEM.md) - Colors, typography, tokens
- [Technical Architecture](./TECHNICAL_ARCHITECTURE.md) - Tech stack details
- [Development Guide](./DEVELOPMENT_GUIDE.md) - Setup and conventions


-----------------------------------------------------------------------------------------------------------------


# Documentation for StyrCan Application

This plan creates comprehensive documentation covering the application overview, technical architecture, design system, and component details.

---

## Files to Create

### 1. docs/README.md
Main documentation file providing a complete overview of the StyrCan application:

**Contents:**
- Project overview and mission
- Core functionalities description (Employee Management, Financial Management, Payroll, Communication, Analytics)
- Problems the platform solves
- Value propositions
- Getting started instructions
- Links to other documentation files

---

### 2. docs/TECHNICAL_ARCHITECTURE.md
Detailed technical documentation covering the stack and architecture:

**Contents:**
- Technology stack breakdown:
  - Frontend: React 18 + TypeScript
  - Build Tool: Vite 5
  - Styling: Tailwind CSS 3.4 + shadcn/ui
  - State Management: TanStack React Query
  - Routing: React Router DOM 6
  - Form Handling: React Hook Form + Zod validation
  - Icons: Lucide React
  - Animations: tailwindcss-animate
- Project structure explanation
- Path aliases configuration (@/)
- Component architecture (UI components vs. page components)
- Build and development scripts

---

### 3. docs/DESIGN_SYSTEM.md
Complete design system documentation:

**Contents:**
- Color palette with CSS variable definitions:
  - Primary colors (Professional Blue - HSL 221 83% 53%)
  - Secondary colors (Trust Purple - HSL 262 83% 58%)
  - Status colors (Success, Warning, Destructive)
  - Neutral/muted colors
- Gradient system:
  - gradient-primary (blue to purple)
  - gradient-secondary (purple to magenta)
  - gradient-subtle (background gradients)
  - gradient-card (card backgrounds)
- Shadow system (card, card-hover, business shadows)
- Animation and transition tokens
- Border radius tokens
- Typography guidelines
- Dark mode support documentation

---

### 4. docs/COMPONENTS.md
Component reference documentation:

**Contents:**
- Page Components:
  - Header: Navigation, mobile menu, branding
  - Hero: Main landing section with CTA, stats, trust badges
  - Features: 6 main features + 3 additional features grid
  - Benefits: Problem/solution cards, testimonials, stats
  - Footer: Newsletter, navigation links, contact info
- UI Component Library (shadcn/ui based):
  - Button variants (default, hero, business, success, destructive, outline, ghost, link)
  - Card, Badge, and other primitives
- Styling conventions and patterns used
- Icon usage guidelines (Lucide React)

---

### 5. docs/DEVELOPMENT_GUIDE.md
Developer setup and contribution guide:

**Contents:**
- Prerequisites (Node.js, npm/bun)
- Installation steps
- Available scripts (dev, build, lint, preview)
- File naming conventions
- Component creation patterns
- CSS/Tailwind conventions
- Code organization best practices

---

## Documentation Structure

```text
docs/
+-- README.md                    # Main overview
+-- TECHNICAL_ARCHITECTURE.md    # Tech stack and project structure
+-- DESIGN_SYSTEM.md             # Colors, typography, tokens
+-- COMPONENTS.md                # Component reference
+-- DEVELOPMENT_GUIDE.md         # Developer setup guide
```

---

## Technical Details

### Design System Tokens (from index.css)

| Token | Light Mode Value | Description |
|-------|-----------------|-------------|
| --primary | 221 83% 53% | Professional Blue |
| --secondary | 262 83% 58% | Trust Purple |
| --success | 142 76% 36% | Green status |
| --warning | 38 92% 50% | Orange/amber |
| --destructive | 0 84% 60% | Red for errors |
| --radius | 0.75rem | Border radius base |

### Custom Button Variants (from button.tsx)

| Variant | Description |
|---------|-------------|
| hero | Gradient background, spring animation, prominent shadow |
| business | Card-style button with border and hover effects |
| success | Green status button |

### Component Dependencies

- All UI components use shadcn/ui patterns with Radix UI primitives
- Tailwind CSS utility classes with custom design tokens
- Class variance authority (cva) for variant management
- tailwind-merge and clsx for className handling

---

## Implementation Steps

1. Create the `docs/` directory
2. Write README.md with full application overview
3. Write TECHNICAL_ARCHITECTURE.md with stack details
4. Write DESIGN_SYSTEM.md with all design tokens
5. Write COMPONENTS.md with component documentation
6. Write DEVELOPMENT_GUIDE.md with setup instructions

All documentation will be written in Markdown format for easy reading on GitHub and other platforms.




