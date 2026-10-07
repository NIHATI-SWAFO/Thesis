import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center font-manrope">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4 shadow-sm border border-amber-200">
            <span className="material-symbols-outlined text-3xl">warning</span>
          </div>
          <h2 className="text-xl font-bold font-pjs text-slate-800 mb-2">
            Something went wrong loading this section
          </h2>
          <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
            {this.state.error?.message || "An unexpected error occurred while rendering this page."}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-[#003624] text-white font-pjs font-bold text-xs uppercase tracking-wider hover:bg-[#004d33] transition-all shadow-sm cursor-pointer"
            >
              Reload Page
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/student/dashboard';
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-pjs font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-all cursor-pointer"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
