import { useState, type FormEvent } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { GoogleIcon } from "@hugeicons/core-free-icons"

import { LogoOrbit } from "@/components/brand/LogoOrbit"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/useAuth"

type AuthMode = "login" | "signup"

export function AuthScreen() {
  const { isLoading, login, signInWithGoogle, signUp } = useAuth()
  const [mode, setMode] = useState<AuthMode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isSignup = mode === "signup"
  const canSubmit = email.trim() && password.length >= 6 && !isSubmitting && !isLoading

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setIsSubmitting(true)

    try {
      if (isSignup) {
        const signedIn = await signUp(email.trim(), password, username.trim())
        if (!signedIn) {
          setMessage("Account created. Disable email confirmation in Supabase for instant testing, or confirm the email.")
        }
      } else {
        await login(email.trim(), password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogle = async () => {
    setError(null)
    setIsSubmitting(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.")
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-hero" aria-label="Alaqay welcome">
        <LogoOrbit />
        <div className="brand-copy">
          <p className="eyebrow">Alaqay PWA</p>
          <h1>Light the routine.</h1>
          <p>Morning and evening brushing become Sparks you can feel proud of.</p>
        </div>
      </section>

      <Card className="auth-card">
        <CardHeader>
          <CardTitle>{isSignup ? "Create account" : "Welcome back"}</CardTitle>
          <CardDescription>{isSignup ? "Start with email and password." : "Sign in to continue your Sparks."}</CardDescription>
        </CardHeader>
        <CardContent className="auth-form">
          <Button type="button" variant="outline" className="wide-button" onClick={handleGoogle} disabled={isSubmitting}>
            <HugeiconsIcon icon={GoogleIcon} size={18} />
            Continue with Google
          </Button>
          <div className="divider"><span>or</span></div>

          <form className="auth-fields" onSubmit={handleSubmit}>
            {isSignup && (
              <div className="field">
                <Label htmlFor="username">Name</Label>
                <Input id="username" autoComplete="name" value={username} onChange={(event) => setUsername(event.target.value)} />
              </div>
            )}
            <div className="field">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="field">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
            </div>

            {error && <p className="error-message">{error}</p>}
            {message && <p className="success-message">{message}</p>}

            <Button type="submit" className="wide-button primary-glow" disabled={!canSubmit}>
              {isSubmitting ? "Please wait..." : isSignup ? "Create account" : "Sign in"}
            </Button>
          </form>

          <p className="auth-toggle">
            {isSignup ? "Already have an account?" : "No account yet?"}{" "}
            <button type="button" onClick={() => setMode(isSignup ? "login" : "signup")}>
              {isSignup ? "Sign in" : "Create one"}
            </button>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
