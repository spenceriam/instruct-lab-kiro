# AGENTS.md

**Instruct-Lab** is an AI system instruction testing & optimization platform designed for Kiro's hackathon. It enables developers and AI practitioners to test, evaluate, and optimize their system instructions across multiple AI models using OpenRouter's unified API, providing quantitative metrics on instruction effectiveness without vendor lock-in.

**Current Status**: Planning/Design phase - the project has comprehensive specifications but hasn't been implemented yet.

## Commands

Since this is currently in planning phase, these commands represent the intended development workflow once implementation begins:

```bash
# Install dependencies (planned)
npm install
# or
pnpm install

# Start development server (planned)
npm run dev
# or  
pnpm dev

# Build for production (planned)
npm run build

# Start production server (planned)
npm start

# Run tests (planned)
npm test
# or
pnpm test

# Lint code (planned)
npm run lint
# or
pnpm lint

# Format code (planned)
npm run format

# Generate code from specs (when implemented)
kiro generate

# Run Kiro hooks
kiro hooks run pre-commit

# Format after generation
kiro hooks run post-generate
```

## Architecture

### System Overview
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   API Layer      │────▶│   OpenRouter    │
│   (Next.js 14)  │     │   (Next.js API)  │     │   Integration   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                         │
        ▼                        ▼                         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Browser Storage│     │  Session Manager │     │  Model Registry │
│  (SessionStore) │     │   (Ephemeral)    │     │   (API Cache)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

**Technology Stack:**
- Framework: Next.js 14+ (App Router) with TypeScript
- UI Components: shadcn/ui + MagicUI
- Icons: Phosphor Icons  
- Styling: Tailwind CSS (minimal, clean aesthetic)
- State Management: Zustand with session storage persistence
- API Integration: OpenRouter SDK/REST API
- Deployment: Vercel Edge Functions

**Core Components:**
1. **Dual-Model Evaluation Engine** - Primary model executes instructions, GPT-4 evaluates effectiveness
2. **Model Selection Service** - Searches OpenRouter registry, validates API keys
3. **Session Management** - Browser-only storage with encryption, no server-side retention
4. **Export Service** - Generate downloadable reports (JSON, CSV, PDF) locally

**Evaluation Logic:**
Success probability calculated from weighted metrics:
- Coherence (20%): Logical structure and clarity
- Task Completion (35%): Addresses user prompt fully  
- Instruction Adherence (35%): Follows system instructions
- Efficiency (10%): Concise while complete

## Workflows

### Development Workflow
1. **Setup**: Install dependencies, configure environment
2. **Implement**: Follow 22-step plan in `.kiro/specs/instruct-lab/tasks.md`
3. **Test**: Unit tests for services, integration tests for workflow
4. **Deploy**: Vercel deployment with Edge Functions

### Testing Workflow
1. User enters OpenRouter API key (validated & encrypted)
2. Search and select AI model from OpenRouter registry
3. Input system instructions and test prompt
4. Execute dual-model evaluation:
   - Primary model generates response
   - Evaluation model scores effectiveness
5. Display quantitative metrics with export options
6. Save to session history for comparison

### Key Development Tasks
The `.kiro/specs/instruct-lab/tasks.md` file contains a comprehensive 22-step implementation plan covering:
- **Phase 1** (30min): Next.js setup, dependencies, structure
- **Phase 2** (45min): OpenRouter integration, model search  
- **Phase 3** (60min): Evaluation engine, metrics calculation
- **Phase 4** (45min): UI implementation, results visualization
- **Phase 5** (30min): Polish, testing, optimization

## Project Structure

### Current Structure
```
instruct-lab-kiro/
├── .git/
├── .kiro/
│   └── specs/
│       └── instruct-lab/
│           ├── requirements.md    # Detailed user stories & acceptance criteria
│           ├── tasks.md          # 22-step implementation plan
│           └── design.md         # Technical architecture & interfaces
├── instruct-lab-prd.md          # Comprehensive product requirements
├── instruct-lab-wireframes.html # Interactive UI mockups
└── .gitattributes
```

### Planned Structure (Post-Implementation)
```
instruct-lab/
├── .kiro/
│   ├── specs/
│   ├── hooks/
│   └── steering/
├── src/
│   ├── app/                     # Next.js App Router pages
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── modals/              # Modal system
│   │   └── test-flow/           # Testing workflow components
│   ├── services/
│   │   ├── openrouter.ts        # OpenRouter API integration
│   │   ├── evaluation.ts        # Dual-model evaluation
│   │   ├── session.ts           # Session & security management
│   │   └── export.ts            # File export functionality
│   └── lib/
│       ├── store.ts             # Zustand state management
│       ├── encryption.ts        # API key encryption
│       └── utils.ts             # Utility functions
├── tests/
├── public/
└── package.json
```

## Context

### Kiro Hackathon Context
- **Category**: Productivity & Workflow Tools
- **Goal**: Demonstrate spec-driven development with Kiro IDE
- **Timeline**: Hackathon project with defined implementation phases
- **Evaluation**: Must show quantitative instruction testing across models

### Business Requirements
- **Privacy-First**: No data retention beyond session
- **Model-Agnostic**: Works with any OpenRouter model
- **Cost Transparent**: Clear token usage and cost tracking
- **Developer-Friendly**: Clean UI enabling rapid iteration

### Technical Constraints
- Browser-based application (no desktop requirement initially)
- Session-only storage (privacy compliance)
- OpenRouter API dependency (no direct model hosting)
- Vercel deployment target

### Security & Privacy
- API keys encrypted in sessionStorage only (never localStorage)
- No server-side data storage
- Direct API communication (no proxy)
- Session-only data retention
- Automatic data expiration

### Repository Rules
When working in this repository, always:
1. **Check documentation first**: Review `instructions.md`, `rules.md`, `plan.md` if they exist
2. **Follow Electron best practices** when Electron features are added
3. **Use Three.js documentation** only if Three.js is implemented
4. **Create detailed git commits** and stage changes as specified in user rules
5. **Consider security**: Never expose API keys, use encryption for sensitive data
6. **Maintain privacy**: No server-side data storage, session-only retention

## Contributing for Agents

### Getting Started
1. **Read this file first** before making any changes
2. **Review the comprehensive specs** in `.kiro/specs/instruct-lab/` 
3. **Follow the implementation plan** in `tasks.md` for systematic development
4. **Test thoroughly** with unit tests for services and integration tests for workflow

### Development Guidelines
- **Maintain the architecture** described in the design document
- **Respect privacy constraints** - no server-side storage, encryption for API keys
- **Use semantic commit messages** following conventional commits
- **Stage and commit changes** as specified in repository rules
- **Test with real OpenRouter API** to validate integration

### Implementation Order
- Start with the Next.js 14 setup (Task 1)
- Implement OpenRouter integration early (Task 7) 
- Build the dual-model evaluation system (Task 11)
- Focus on privacy and security throughout
- Follow the UI/UX wireframes for consistent design
- Test each component as it's built

### Key Files to Review
- `.kiro/specs/instruct-lab/requirements.md` - Detailed user stories & acceptance criteria
- `.kiro/specs/instruct-lab/tasks.md` - 22-step implementation plan
- `.kiro/specs/instruct-lab/design.md` - Technical architecture & interfaces
- `instruct-lab-prd.md` - Comprehensive product requirements
- `instruct-lab-wireframes.html` - Interactive UI mockups

The project is well-documented with comprehensive specifications. Success depends on following the planned architecture and maintaining the privacy-first, session-only approach to data handling.
