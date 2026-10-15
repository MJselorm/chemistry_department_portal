import React from 'react'
import StatusPage from './StatusPage'

export default class ErrorBoundary extends React.Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error('Unhandled interface error', error, info)
  }

  render() {
    if (this.state.failed) return <StatusPage status={500} onRetry={() => this.setState({ failed: false })} />
    return this.props.children
  }
}
