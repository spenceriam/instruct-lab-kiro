'use client'

interface FooterProps {
  onOpenPrivacy?: () => void
  onOpenTerms?: () => void
}

export default function Footer({ onOpenPrivacy, onOpenTerms }: FooterProps) {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          {/* Left side - Project info */}
          <div className="flex items-center gap-4">
            <p>© 2025 Instruct-Lab</p>
            <p className="hidden md:inline">AI System Instruction Testing Platform</p>
          </div>

          {/* Right side - Links */}
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenPrivacy}
              className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
              type="button"
            >
              Privacy Policy
            </button>
            <button
              onClick={onOpenTerms}
              className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
              type="button"
            >
              Terms of Use
            </button>
            <p className="text-xs">
              Built for Kiro Hackathon
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
