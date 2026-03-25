# E-Commerce User Module

A Next.js 14 e-commerce platform user module built with TypeScript and Tailwind CSS.

## Features

- **Authentication**: User registration and login with NextAuth
- **Product Management**: Browse products, search, and view details
- **Shopping Cart**: Add/remove items, update quantities
- **Checkout**: Complete orders with shipping and payment
- **Order History**: View past orders and their status
- **Responsive Design**: Mobile-first design with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **Form Handling**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Update the following variables in `.env.local`:
   ```
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   ADMIN_API_URL=http://localhost:8000/api
   ADMIN_API_KEY=your-admin-api-key-here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── api/
│   └── auth/[...nextauth]/route.ts
├── products/
│   ├── page.tsx
│   └── [id]/page.tsx
├── user/
│   ├── cart/page.tsx
│   ├── checkout/page.tsx
│   └── orders/page.tsx
├── globals.css
├── layout.tsx
└── page.tsx
lib/
├── api.ts
└── auth.ts
types/
└── index.ts
```

## API Integration

The application integrates with an admin API for:

- User authentication
- Product data
- Cart management
- Order processing

API endpoints are configured in `lib/api.ts` and use the base URL from environment variables.

## Authentication

Uses NextAuth.js with credentials provider for authentication. Session management is handled automatically with JWT tokens.

## Styling

Tailwind CSS is configured with a custom theme including:
- Primary, secondary, and accent color palettes
- Custom spacing and border radius
- Animation utilities
- Component classes (buttons, cards, inputs)

## TypeScript

Full TypeScript support with:
- Strict type checking
- Shared type definitions in `types/index.ts`
- Proper typing for API responses and forms

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

See `.env.example` for all required environment variables.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License
