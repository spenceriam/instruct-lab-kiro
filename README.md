# Instruct-Lab

An AI system instruction testing and optimization platform that enables developers to test, evaluate, and optimize their system instructions across multiple AI models using OpenRouter's unified API.

![Instruct-Lab Screenshot](docs/screenshot.png)

## Overview

Instruct-Lab provides quantitative metrics on instruction effectiveness without vendor lock-in. The platform uses a dual-model evaluation system where your selected primary model executes the instructions, and your chosen evaluation model scores the effectiveness of the response.

## How It Works

1. **API Key Setup**: Enter your OpenRouter API key for model access
2. **Primary Model Selection**: Choose the AI model to test your instructions with
3. **Evaluation Model Selection**: Choose the AI model that will score response effectiveness
4. **System Instructions**: Define how the AI should behave and respond
5. **Test Prompt**: Provide a test scenario to evaluate instruction effectiveness
6. **Dual Evaluation**: Primary model generates response, evaluation model scores effectiveness
7. **Results Analysis**: View quantitative metrics and export results

## Key Features

- **Model Agnostic**: Works with any OpenRouter-supported model (OpenAI, Anthropic, Google, etc.)
- **Privacy First**: No server-side data storage, session-only retention
- **Quantitative Scoring**: Coherence, task completion, instruction adherence, and efficiency metrics
- **Export Options**: Download results as JSON, CSV, or PDF reports
- **Cost Tracking**: Monitor token usage and API costs
- **Session History**: Compare multiple test runs within your session

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- OpenRouter API key ([Get one here](https://openrouter.ai/keys))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/instruct-lab-kiro.git
cd instruct-lab-kiro
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Start the development server:
```bash
npm run dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Production Build

```bash
npm run build
npm start
```

## Usage

1. **Enter API Key**: Input your OpenRouter API key (encrypted and stored locally)
2. **Select Primary Model**: Choose the AI model to test your instructions with
3. **Select Evaluation Model**: Choose the AI model that will score response quality
4. **Write Instructions**: Create detailed system instructions for the AI
5. **Test Prompt**: Provide a test scenario to evaluate effectiveness
6. **Run Evaluation**: Execute the dual-model evaluation process
7. **Review Results**: Analyze metrics and export data as needed

## Technology Stack

- **Framework**: Next.js 14 with TypeScript
- **UI**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand with session storage
- **API Integration**: OpenRouter SDK
- **Testing**: Vitest with 96%+ test coverage
- **Deployment**: Vercel Edge Functions

## Development

### Running Tests

```bash
npm test
# or
pnpm test
```

### Code Quality

```bash
npm run lint
npm run format
```

### Environment Variables

Create a `.env.local` file (optional):
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Architecture

The application follows a privacy-first architecture with no server-side data persistence:

- **Frontend**: Next.js 14 with App Router
- **State**: Zustand store with encrypted session storage
- **API**: Direct integration with OpenRouter API
- **Security**: Web Crypto API for key encryption
- **Evaluation**: Dual-model system (user-selected primary + evaluation models)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

Built for the Kiro IDE Hackathon demonstrating spec-driven development and comprehensive testing practices.