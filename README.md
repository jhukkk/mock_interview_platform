# Mock Interview Platform

[Live Demo](https://mock-interview-platform-sigma-three.vercel.app/)

![Mock Interview Platform](/public/robot.png)

## Overview

An AI-powered mock interview platform that helps job seekers practice technical interviews and receive instant feedback on their performance. Users can select from various interview types, practice with different technical stacks, and get comprehensive assessments to identify strengths and areas for improvement.

## Features

- **AI-Powered Interviews**: Practice with a realistic AI interviewer using Gemini 2.0 Flash and Vapi AI for natural conversational flow
- **Diverse Interview Types**: Choose from behavioral, technical, or mixed-format interviews
- **Tech Stack Selection**: Practice interviews targeted to specific technologies (React, Node.js, Python, etc.)
- **Responsive Design**: Mobile-first approach with fluid layout on all screen sizes
- **Serverless Backend**: Built on Next.js API routes for scalable interview processing
- **Custom Firebase Integration**: Secure authentication and Firestore database for user data management
- **Real-time Updates**: Immediate feedback generation and storage after interview completion
- **Data Deduplication**: Intelligent handling of repeated interview sessions while maintaining performance history
- **Optimized Performance**: Efficient data fetching patterns for smooth user experience

## Demo Video

<!-- Insert your demo video here -->
<!-- Example: ![Demo Video](link_to_your_demo_video) -->

## Technology Stack

- **Frontend**: Next.js 15.2.4, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (Serverless Functions)
- **AI**: Google Gemini 2.0 Flash, Vapi AI
- **Database**: Firebase (Firestore)
- **Authentication**: Firebase Authentication
- **Deployment**: Vercel

## Screenshots

### Homepage
<!-- ![Homepage](/path/to/homepage_screenshot.jpg) -->

### Interview Selection
<!-- ![Interview Selection](/path/to/selection_screenshot.jpg) -->

### Interview in Progress
<!-- ![Interview in Progress](/path/to/interview_screenshot.jpg) -->

### Feedback Screen
<!-- ![Feedback](/path/to/feedback_screenshot.jpg) -->

## Future Enhancements

- Interview recording and transcripts for later review
- Industry-specific interview templates
- Mock interviews with hiring managers from specific companies
- Collaborative interviews with peers
- Enhanced analytics dashboard for tracking improvement over time
- Specific feature for Leetcode style interviews with local IDE

## Getting Started

To run this project locally:

```bash
# Clone the repository
git clone https://github.com/jhukkk/mock_interview_platform.git

# Install dependencies
cd mock_interview_platform
npm install

# Set up environment variables
# Create a .env.local file with your Firebase and Gemini API credentials

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
├── app/                  # Next.js App Router
│   ├── (auth)/           # Authentication routes
│   ├── (root)/           # Main application routes
│   ├── api/              # API routes for serverless functions
│   └── globals.css       # Global styles
├── components/           # React components
├── constants/            # App constants and configuration
├── firebase/             # Firebase configuration
├── lib/                  # Utility functions and server actions
│   ├── actions/          # Server actions
│   └── utils.ts          # Helper functions
├── public/               # Static files
└── types/                # TypeScript type definitions
```

## Acknowledgments

- [Next.js](https://nextjs.org)
- [Firebase](https://firebase.google.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Google Gemini](https://ai.google.dev/)

