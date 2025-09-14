# Instruct-Lab

An AI system instruction testing and optimization platform that enables developers to test, evaluate, and optimize their system instructions across multiple AI models using OpenRouter's unified API.

## Overview

Instruct-Lab provides quantitative metrics on instruction effectiveness without vendor lock-in. The platform uses a dual-model evaluation system where your selected primary model executes the instructions, and your chosen evaluation model scores the effectiveness of the response.

## What to Expect

When you use Instruct-Lab, you'll go through a guided process that helps you:

- **Test AI Instructions**: See how well your system prompts work with different AI models
- **Get Objective Scores**: Receive quantitative metrics (0-100%) on coherence, task completion, instruction adherence, and efficiency
- **Compare Models**: Test the same instructions across different AI providers (OpenAI, Anthropic, Google, etc.)
- **Track Costs**: Monitor token usage and API costs for both primary and evaluation models
- **Export Results**: Download detailed reports in JSON, CSV, or PDF format
- **Maintain Privacy**: All data stays in your browser session - nothing is stored on servers

The entire process typically takes 2-3 minutes per test, with most of that time spent on AI model processing.

## Key Features

- **Model Agnostic**: Works with any OpenRouter-supported model (OpenAI, Anthropic, Google, etc.)
- **Privacy First**: No server-side data storage, session-only retention
- **Quantitative Scoring**: Coherence, task completion, instruction adherence, and efficiency metrics
- **Export Options**: Download results as JSON, CSV, or PDF reports
- **Cost Tracking**: Monitor token usage and API costs
- **Session History**: Compare multiple test runs within your session

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- OpenRouter API key ([Get one free here](https://openrouter.ai/keys))

### Clone and Run

1. **Clone the repository:**
```bash
git clone https://github.com/your-username/instruct-lab.git
cd instruct-lab
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

4. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

5. **Get your API key:**
- Visit [OpenRouter.ai](https://openrouter.ai/keys)
- Sign up for a free account
- Generate an API key
- You'll need this in the next step

### Production Deployment

For production deployment:

```bash
npm run build
npm start
```

Or deploy directly to Vercel:
```bash
npm run deploy:prod
```

## How to Use Instruct-Lab

### Step 1: Launch and Setup

1. **Start the application** and click "Start Testing"
2. **Enter your OpenRouter API key** when prompted
   - The key is encrypted and stored only in your browser session
   - Wait for the green validation checkmark

### Step 2: Choose Your Models

1. **Select Primary Model**: Choose the AI model you want to test your instructions with
   - Browse models from OpenAI, Anthropic, Google, and other providers
   - Consider cost, speed, and capabilities for your use case
   
2. **Select Evaluation Model**: Choose a model to score the primary model's responses
   - Recommended: Use a different, capable model for objective evaluation
   - Models with strong reasoning work best (GPT-4, Claude, etc.)

### Step 3: Write Your Instructions

1. **Create System Instructions**: Define how the AI should behave
   - Be specific about tone, style, and response format
   - Include examples and constraints
   - Aim for clear, unambiguous language

2. **Write a Test Prompt**: Create a scenario to evaluate your instructions
   - Make it challenging enough to test instruction effectiveness
   - Ensure it allows the AI to demonstrate the behaviors you defined

### Step 4: Run and Review

1. **Run Evaluation**: Click to start the dual-model testing process
   - Primary model generates response using your instructions
   - Evaluation model scores the response quality
   - Process typically takes 30-60 seconds

2. **Review Results**: Examine your scores and metrics
   - **Overall Success Score** (0-100%)
   - **Coherence**: Logic and structure of the response
   - **Task Completion**: How well the prompt was addressed
   - **Instruction Adherence**: Following your system instructions
   - **Efficiency**: Conciseness and relevance

3. **Export and Compare**: Download results or run additional tests
   - Export as JSON, CSV, or PDF
   - View session history to compare different approaches
   - Iterate on your instructions based on results

## Tips for Best Results

### Writing Effective Instructions
- **Be Specific**: Define exact tone, style, and format requirements
- **Include Examples**: Show the AI what good responses look like
- **Set Boundaries**: Clearly state what the AI should and shouldn't do
- **Test Edge Cases**: Use challenging prompts that push your instructions

### Model Selection Strategy
- **Primary Model**: Choose based on your actual use case and budget
- **Evaluation Model**: Pick a different, capable model for objective scoring
- **Cost Awareness**: Monitor token usage - evaluation models add to costs
- **Performance vs Price**: Balance model capabilities with your budget

### Testing Best Practices
- **Realistic Scenarios**: Use prompts that reflect real-world usage
- **Multiple Iterations**: Test variations to refine your approach
- **Compare Results**: Run the same test with different models
- **Document Changes**: Export results to track improvements over time

## Technology Stack

- **Framework**: Next.js 15 with TypeScript
- **UI**: Tailwind CSS + shadcn/ui components  
- **State Management**: Zustand with encrypted session storage
- **API Integration**: OpenRouter unified API
- **Testing**: Vitest with comprehensive test coverage
- **Security**: Web Crypto API for key encryption
- **Deployment**: Vercel with Edge Functions

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Testing & Quality
npm run test         # Run tests
npm run lint         # Check code quality
npm run format       # Format code with Prettier

# Deployment
npm run deploy:preview  # Deploy to Vercel preview
npm run deploy:prod     # Deploy to Vercel production
```

### Environment Configuration

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

Key environment variables:
- `NEXT_PUBLIC_APP_URL`: Your application URL
- `NEXT_PUBLIC_OPENROUTER_API_URL`: OpenRouter API endpoint
- `NEXT_PUBLIC_SESSION_TIMEOUT`: Session timeout in milliseconds

## Architecture

### Privacy-First Design
- **No Server Storage**: All data stays in your browser session
- **Encrypted Keys**: API keys encrypted using Web Crypto API
- **Session Only**: Data cleared when you close the browser
- **Direct API Calls**: No proxy servers - direct to OpenRouter

### Technical Architecture
- **Frontend**: Next.js 15 with App Router and TypeScript
- **State Management**: Zustand store with encrypted session persistence
- **UI Components**: Tailwind CSS with shadcn/ui component library
- **API Integration**: Direct OpenRouter API integration
- **Evaluation System**: Dual-model approach for objective scoring

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter issues or have questions:

1. Check the [Issues](https://github.com/your-username/instruct-lab/issues) page
2. Review the troubleshooting section in the documentation
3. Ensure your OpenRouter API key has sufficient credits
4. Verify your internet connection for API calls

## Creator

Built by **Spencer** ([@spencer_i_am](https://x.com/spencer_i_am))

For questions, feedback, or follow-up discussions, feel free to reach out on X: [https://x.com/spencer_i_am](https://x.com/spencer_i_am)

## Roadmap

Planned features and improvements:
- Additional export formats and integrations
- Batch testing capabilities
- Advanced analytics and comparison tools
- Custom evaluation criteria
- Team collaboration features