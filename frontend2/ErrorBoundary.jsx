import React from 'react'
import StatusPage from './StatusPage'

export default class ErrorBoundary extends React.Component {
  state = { failed: false, error: null }

  static getDerivedStateFromError(error) {
    return { failed: true, error }
  }

  componentDidCatch(error, info) {
    console.error('Unhandled interface error', error, info)
  }

  render() {
    if (this.state.failed) {
      return (
        <StatusPage
          status={500}
          error={this.state.error}
          onRetry={() => this.setState({ failed: false, error: null })}
        />
      )
    }
    return this.props.children
  }
}
