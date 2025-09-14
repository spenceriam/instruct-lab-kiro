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

## How to Use

### Step 1: Get Your OpenRouter API Key

1. Visit [OpenRouter.ai](https://openrouter.ai/keys)
2. Sign up or log in to your account
3. Generate a new API key
4. Copy the API key (you'll need it in the next step)

### Step 2: Configure API Access

1. Open the application at [http://localhost:3000](http://localhost:3000)
2. Click "Start Testing" to begin the setup process
3. In the **OpenRouter API Key** section:
   - Paste your API key into the input field
   - The key is automatically encrypted and stored only in your browser session
   - Wait for the green checkmark indicating successful validation

### Step 3: Select Your Primary Model

1. Once your API key is validated, the **Select Model** section appears
2. Click "Click to search and select a model"
3. In the model search dialog:
   - Use the search bar to find models by name, provider, or description
   - Browse available models from providers like OpenAI, Anthropic, Google, etc.
   - View pricing information and context length for each model
   - Click on your desired model to select it
4. The selected model will be displayed with its specifications

### Step 4: Select Your Evaluation Model

1. After selecting your primary model, the **Select Evaluation Model** section appears
2. Click "Click to search and select an evaluation model"
3. Choose a model that will score the primary model's responses:
   - **Recommended**: Use a different, capable model (like GPT-4, Claude, etc.) for objective evaluation
   - **Consider**: Models with strong reasoning capabilities work best for evaluation
   - **Pricing**: Factor in evaluation model costs as it will analyze each response
4. Click on your chosen evaluation model to select it

### Step 5: Write System Instructions

1. Click "Next: Instructions" to proceed to the instructions step
2. In the **System Instructions** text area:
   - Write detailed instructions defining how the AI should behave
   - Be specific about tone, style, and response format
   - Include any constraints or special requirements
   - Aim for 50+ characters for meaningful instructions
3. Use the provided tips for writing effective instructions:
   - Be specific about desired tone and style
   - Include examples when possible
   - Define the role and context clearly
   - Use clear, unambiguous language

### Step 6: Create a Test Prompt

1. Click "Continue to Test" to move to the testing step
2. In the **Test Prompt** section:
   - Write a specific scenario or question to test your instructions
   - Make it challenging enough to evaluate instruction effectiveness
   - Ensure it allows the AI to demonstrate the behaviors defined in your instructions
3. Review the **System Instructions Preview** to confirm your setup
4. Check the **Selected Model** information to verify your choices

### Step 7: Run the Evaluation

1. Click "Run Evaluation" to start the dual-model process
2. The system will:
   - Send your test prompt to the primary model with your system instructions
   - Send the primary model's response to the evaluation model for scoring
   - Calculate metrics based on coherence, task completion, instruction adherence, and efficiency
3. Wait for the evaluation to complete (typically 30-60 seconds)

### Step 8: Review Results

1. View your **Overall Success Score** (0-100%)
2. Examine individual metrics:
   - **Coherence**: How logical and well-structured is the response
   - **Task Completion**: How completely the response addresses the prompt
   - **Instruction Adherence**: How well the response follows your system instructions
   - **Efficiency**: How concise and relevant the response is
3. Review **Token Usage** and **Cost Breakdown** for both models
4. Read the **Evaluation Explanation** for detailed feedback

### Step 9: Export and Compare

1. **Export Results**: Download your results as JSON, CSV, or PDF
2. **Session History**: View all tests from your current session
3. **Compare Tests**: Run multiple evaluations with different:
   - System instructions
   - Models
   - Test prompts
4. **Clear History**: Remove all session data when finished

## Tips for Best Results

- **Instruction Quality**: Spend time crafting clear, specific system instructions
- **Model Selection**: Choose models appropriate for your use case and budget
- **Test Scenarios**: Use realistic prompts that reflect actual usage
- **Evaluation Models**: Select capable models for objective scoring
- **Iteration**: Run multiple tests to refine your instructions
- **Cost Management**: Monitor token usage and costs for both models

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