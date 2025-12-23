# Learning Assistant

A comprehensive AI-powered learning platform designed to help students study more effectively through intelligent quizzes, spaced repetition, performance analytics, and personalized study recommendations.

## Features

### Core Study Tools
- **Smart Quiz Generation** – AI-powered quizzes automatically generated from your notes and documents
- **Interactive Flashcards** – Spaced repetition system for optimal retention and learning
- **Pomodoro Timer** – Focused study sessions with built-in breaks to maintain productivity
- **Document Upload** – Upload PDFs and notes to create study materials

### Analytics & Insights
- **Dashboard** – Overview of your learning progress with key metrics
- **Contribution Heatmap** – Visual representation of your study activity over time
- **Performance Trends** – Track improvement patterns across different difficulty levels
- **Weakness Detection** – AI identifies areas where you need more practice
- **Leaderboard** – Compete with other learners and track rankings

### Advanced Features
- **Study Path Recommendations** – Personalized learning paths based on your performance
- **Concept Mapping** – Visualize relationships between topics
- **Paper Prediction** – Predict likely exam questions and topics
- **Achievement System** – Earn badges and milestones for consistent learning
- **Study Tips** – Contextual advice tailored to your learning style and weaknesses

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- A Supabase account (free tier available at [supabase.com](https://supabase.com))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd learning-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your Supabase credentials in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage

### Authentication
1. Visit the app and click "Sign In" or "Sign Up"
2. Create an account with your email and password
3. Access your personalized dashboard

### Creating Study Materials
1. Go to **Upload** to add PDFs or notes
2. The AI extracts key concepts automatically
3. Use the extracted content to generate quizzes and flashcards

### Taking Quizzes
1. Navigate to **Quiz** section
2. Select difficulty level (Easy, Medium, Hard)
3. Answer questions and get instant feedback
4. View detailed performance metrics

### Using Flashcards
1. Access **Flashcards** from the main menu
2. Review cards with spaced repetition algorithm
3. Mark cards as known/unknown to adjust frequency
4. Track mastery progress

### Tracking Progress
1. View your **Dashboard** for overall statistics
2. Check the **Contribution Heatmap** to see activity patterns
3. Review **Weakness Analysis** for improvement areas
4. Follow **Study Path** recommendations

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Full page components
├── lib/                # Utility functions and services
├── store/              # Zustand state management
├── types/              # TypeScript type definitions
└── hooks/              # Custom React hooks

supabase/
├── migrations/         # Database schema migrations
└── functions/          # Edge functions for backend logic
```

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **Routing**: React Router
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Backend Functions**: Supabase Edge Functions

## Database Schema

The application uses the following main tables:
- `users` – User account information
- `notes` – Uploaded study materials
- `quiz_attempts` – Quiz performance records
- `quiz_questions` – Generated quiz questions
- `flashcards` – Flashcard collections
- `study_sessions` – Pomodoro session logs
- `achievements` – User badges and milestones
- `weakness_areas` – Detected areas needing improvement

## API Endpoints

The app uses Supabase Edge Functions for:
- Text extraction from PDFs
- AI-powered quiz generation
- Content summarization
- Paper prediction analysis
- Concept relationship detection

## Performance Optimization

- Lazy loading of pages and components
- Optimized database queries with proper indexing
- Efficient state management to prevent unnecessary re-renders
- CSS minification and bundling via Vite

## Security

- Row-level security (RLS) policies on all database tables
- Secure authentication with Supabase Auth
- JWT token-based API requests
- Environment variable protection
- HTTPS enforcement in production

## Development

### Running Tests
```bash
npm run test
```

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

### Building for Production
```bash
npm run build
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Known Limitations

- Document processing limited to PDF format
- Quiz generation requires minimum content (100+ words)
- Flashcard review limited to 500 cards per session

## Contributing

Contributions are welcome! Please follow these guidelines:
1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact support at support@learningassistant.com
- Check the documentation at docs/

## Roadmap

- Mobile native apps (iOS/Android)
- Real-time collaboration for group study
- Video lecture integration
- Advanced spaced repetition algorithms
- Gamification enhancements
- API for third-party integrations

## Acknowledgments

Built with modern web technologies and AI-powered learning science principles.
