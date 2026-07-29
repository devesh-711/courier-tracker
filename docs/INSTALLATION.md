# Installation & Setup Guide

## Prerequisites
Ensure you have the following installed on your machine:
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or yarn / pnpm)

## Step-by-Step Local Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/d3v3sh-711/courier-tracking-system.git
   cd courier-tracking-system
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

5. **Type Check & Linting**
   ```bash
   npm run build
   ```
