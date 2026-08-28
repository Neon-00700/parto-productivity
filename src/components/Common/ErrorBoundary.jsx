import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
          <div className="max-w-md text-center space-y-4">
            <div className="text-5xl">😵</div>
            <h1 className="text-xl font-bold">Something went wrong / خطایی رخ داد</h1>
            <p className="text-sm text-slate-400 break-all">{String(this.state.error?.message || this.state.error)}</p>
            <button
              className="px-4 py-2 rounded-xl bg-sky-500 text-white font-semibold"
              onClick={() => { this.setState({ error: null }); window.location.hash = '#/'; }}
            >
              Reload / بارگذاری مجدد
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
