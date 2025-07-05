# Firework World Mini App

A Next.js 15 mini app designed to run inside the World App, featuring World ID authentication and a modern UI for managing digital assets and rewards.

## Features

- 🔐 **World ID Authentication** - Secure sign-in using World App's built-in authentication
- 💰 **Asset Management** - View and manage your digital assets with real-time rates
- 🎁 **Rewards System** - Track and claim your rewards
- 📱 **Mobile-First Design** - Optimized for World App's mobile interface
- 🎨 **Modern UI** - Built with Tailwind CSS and shadcn/ui components

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- World App (for full functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fireworks
   ```

2. **Navigate to the mini app**
   ```bash
   cd firework-mini-app
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   - Local: `http://localhost:3000`
   - For World App testing: Use ngrok or similar tunnel service

## Development

The app is built with:
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI components
- **World ID MiniKit** - World App integration

## Project Structure

```
firework-mini-app/
├── src/
│   ├── app/           # Next.js App Router pages
│   │   ├── auth/      # Authentication page
│   │   ├── assets/    # Asset management
│   │   └── rewards/   # Rewards system
│   ├── components/    # Reusable UI components
│   └── contexts/      # React contexts
├── public/            # Static assets
└── package.json
```

## World App Integration

This mini app is designed to run inside the World App environment. For full functionality:
- Use the World App browser
- Test authentication flow
- Access World ID features

## License

MIT License 