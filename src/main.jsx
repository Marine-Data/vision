import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null } }
  static getDerivedStateFromError(err) { return { err } }
  render() {
    if (this.state.err) {
      return React.createElement('pre',
        { style: { padding: 16, whiteSpace: 'pre-wrap', font: '12px/1.5 monospace', color: '#c15a3d', background: '#fbfcfb' } },
        '⚠️ Erreur d\'affichage\n\n' + (this.state.err.stack || this.state.err.message || String(this.state.err)))
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  React.createElement(ErrorBoundary, null, React.createElement(App))
)
