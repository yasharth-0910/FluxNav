# Delhi Metro Route Finder

A modern web application that helps users find the best routes between Delhi Metro stations, focusing on interchanges and providing a smooth user experience.

## Features

- Find routes between any two Delhi Metro stations
- View detailed station information
- Visual representation of the route with line colors
- Interchange information and travel tips
- Modern and responsive UI design

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL

## Getting Started

### Prerequisites

- Node.js 18 or later
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/delhi-metro.git
cd delhi-metro
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up your environment variables:
Create a `.env` file in the root directory with the following variables:
```env
DATABASE_URL=""
GEMINI_API = 
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

## Project Structure

- `src/app` - Next.js app router pages and API routes
- `src/components` - React components
- `src/lib` - Utility functions and services
- `prisma` - Database schema and migrations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
