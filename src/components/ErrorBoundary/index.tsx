import type { ReactNode } from 'react'
/**
 * 错误边界组件
 * 捕获子组件的渲染错误，显示友好的错误页面
 */
import { Component } from 'react'
import './style.css'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary 捕获到错误:', error, errorInfo)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary__content">
            <div className="error-boundary__icon">⚠️</div>
            <h2 className="error-boundary__title">页面出了点问题</h2>
            <p className="error-boundary__message">
              {this.state.error?.message || '发生了未知错误'}
            </p>
            <div className="error-boundary__actions">
              <button
                type="button"
                className="error-boundary__btn error-boundary__btn--primary"
                onClick={this.handleReset}
              >
                重试
              </button>
              <button
                type="button"
                className="error-boundary__btn error-boundary__btn--secondary"
                onClick={this.handleReload}
              >
                刷新页面
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
