import React, { useState } from 'react';
import { X, Settings, Copy, Check, Archive, Globe } from 'lucide-react';

interface FormSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    requireLogin: boolean;
    oneSubmissionOnly: boolean;
    enableTimer: boolean;
    timerMinutes: number;
  };
  onSave: (settings: {
    requireLogin: boolean;
    oneSubmissionOnly: boolean;
    enableTimer: boolean;
    timerMinutes: number;
  }) => void;
  formId?: string;
  formStatus?: 'draft' | 'published';
  onStatusChange?: (status: 'draft' | 'published') => void;
}

export const FormSettingsDialog: React.FC<FormSettingsDialogProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  formId,
  formStatus,
  onStatusChange,
}) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const formUrl = formId ? `${window.location.origin}/quiz/${formId}` : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Settings className="text-purple-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-800">
              {formId ? 'Chia sẻ Form' : 'Cài đặt Form'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Share Link Section */}
          <div className="pb-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3">Link làm bài</h3>
            {formId ? (
              <>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={formUrl}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-700 font-mono text-sm"
                  />
                  <button
                    onClick={handleCopy}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                      copied
                        ? 'bg-green-500 text-white'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check size={18} />
                        Đã sao chép!
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        Sao chép
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Chia sẻ link này để người dùng có thể trả lời form của bạn
                </p>
              </>
            ) : (
              <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  💡 Vui lòng lưu form trước để tạo link làm bài
                </p>
              </div>
            )}
          </div>

          {/* Status Section */}
          {formId && formStatus && onStatusChange && (
            <div className="pb-6 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3">Trạng thái Form</h3>
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    formStatus === 'published'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {formStatus === 'published' ? <Globe size={18} /> : <Archive size={18} />}
                  <span className="font-semibold">
                    {formStatus === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                  </span>
                </div>
                <button
                  onClick={() => onStatusChange(formStatus === 'published' ? 'draft' : 'published')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                    formStatus === 'published'
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {formStatus === 'published' ? 'Chuyển về nháp' : 'Xuất bản'}
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {formStatus === 'published'
                  ? 'Form đang hiển thị công khai. Chuyển về nháp để ẩn đi.'
                  : 'Form đang ở chế độ nháp. Xuất bản để người dùng có thể làm bài.'}
              </p>
            </div>
          )}

          {/* Settings Section */}
          {/* Require Login */}
          <div className="flex items-start gap-4">
            <input
              type="checkbox"
              id="requireLogin"
              checked={localSettings.requireLogin}
              onChange={e => setLocalSettings({ ...localSettings, requireLogin: e.target.checked })}
              className="w-5 h-5 text-purple-600 rounded mt-1 cursor-pointer"
            />
            <div className="flex-1">
              <label
                htmlFor="requireLogin"
                className="font-semibold text-gray-800 cursor-pointer block"
              >
                Yêu cầu đăng nhập
              </label>
              <p className="text-sm text-gray-600 mt-1">
                Người dùng phải đăng nhập mới có thể làm bài
              </p>
            </div>
          </div>

          {/* One Submission Only */}
          <div className="flex items-start gap-4">
            <input
              type="checkbox"
              id="oneSubmission"
              checked={localSettings.oneSubmissionOnly}
              onChange={e =>
                setLocalSettings({ ...localSettings, oneSubmissionOnly: e.target.checked })
              }
              className="w-5 h-5 text-purple-600 rounded mt-1 cursor-pointer"
            />
            <div className="flex-1">
              <label
                htmlFor="oneSubmission"
                className="font-semibold text-gray-800 cursor-pointer block"
              >
                Chỉ cho phép nộp 1 lần
              </label>
              <p className="text-sm text-gray-600 mt-1">
                Mỗi người chỉ được nộp bài một lần duy nhất
              </p>
            </div>
          </div>

          {/* Enable Timer */}
          <div className="flex items-start gap-4">
            <input
              type="checkbox"
              id="enableTimer"
              checked={localSettings.enableTimer}
              onChange={e => setLocalSettings({ ...localSettings, enableTimer: e.target.checked })}
              className="w-5 h-5 text-purple-600 rounded mt-1 cursor-pointer"
            />
            <div className="flex-1">
              <label
                htmlFor="enableTimer"
                className="font-semibold text-gray-800 cursor-pointer block"
              >
                Giới hạn thời gian
              </label>
              <p className="text-sm text-gray-600 mt-1">
                Đặt thời gian làm bài, tự động nộp khi hết giờ
              </p>
            </div>
          </div>

          {/* Timer Minutes Input */}
          {localSettings.enableTimer && (
            <div className="ml-9 pl-4 border-l-2 border-purple-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Thời gian (phút)
              </label>
              <input
                type="number"
                min="1"
                max="180"
                value={localSettings.timerMinutes}
                onChange={e =>
                  setLocalSettings({
                    ...localSettings,
                    timerMinutes: Math.max(1, parseInt(e.target.value) || 30),
                  })
                }
                className="w-32 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Từ 1 đến 180 phút</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all cursor-pointer"
          >
            Lưu cài đặt
          </button>
        </div>
      </div>
    </div>
  );
};
