import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in SmartBooking application:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#111] flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white dark:bg-[#1a1a1a] rounded-2xl p-8 border border-[#EAE3D2] dark:border-[#333] shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-[#C19D60] text-3xl font-serif font-black">
              !
            </div>
            <h2 className="text-2xl font-serif text-[#222] dark:text-white mb-2">Đã xảy ra sự cố hiển thị</h2>
            <p className="text-sm text-[#777] mb-6">
              Ứng dụng gặp lỗi trong quá trình khởi tạo dữ liệu:
            </p>
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-mono mb-6 text-left overflow-auto max-h-36">
              {this.state.error?.message || 'Lỗi không xác định'}
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-[#C19D60] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#A8874E] transition-colors"
              >
                Tải lại trang
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }}
                className="px-6 py-2.5 border border-[#EAE3D2] dark:border-[#333] text-[#555] dark:text-gray-300 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-100 dark:hover:bg-[#222] transition-colors"
              >
                Xóa cache & Thử lại
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
