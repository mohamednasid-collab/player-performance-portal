import { Component, type ReactNode } from 'react'
export class StartupBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) return <div className="login-page"><section className="login-card" role="alert"><h1>CoachPortal could not start</h1><p>{this.state.error.message || 'An unexpected error occurred while loading the portal.'}</p><p>If you just deployed an update, reload the page. For a configuration error, correct the Vercel environment variables and redeploy.</p><button className="primary-btn" onClick={() => window.location.reload()}>Reload CoachPortal</button></section></div>
    return this.props.children
  }
}
