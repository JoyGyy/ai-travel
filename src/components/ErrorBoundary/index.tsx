import type { ReactNode } from 'react'

/**
 * 错误边界组件（Class Component）
 * 捕获子组件的渲染错误，显示友好的错误降级页面
 * 支持 onError 回调，便于接入 Sentry 等监控服务
 * 注意：错误边界只能捕获生命周期和渲染过程中的错误，无法捕获异步代码和事件处理器中的错误
 */
import { Component } from 'react'

import './style.css'

/* ========== 类型定义 ========== */

interface ErrorBoundaryProps {
  children: ReactNode
  /** 错误回调，可用于上报监控服务 */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/* ========== 错误边界类组件 ========== */

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  /** 静态方法：渲染阶段捕获错误，返回新的 state */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  /** 生命周期： componentDidCatch 中将错误信息上报给父组件 */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo)
  }

  /* ========== 事件处理 ========== */

  /** 刷新页面（完全重载） */
  handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  /** 仅重置错误状态，尝试重新渲染子组件 */
  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  /* ========== 渲染逻辑 ========== */

  render() {
    // 有错误时展示降级 UI
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

    // 无错误时正常渲染子组件
    return this.props.children
  }
}
