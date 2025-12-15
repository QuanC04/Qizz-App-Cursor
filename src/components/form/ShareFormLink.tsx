import React, { useState } from 'react';
import { Copy, Check, Link as LinkIcon } from 'lucide-react';

interface ShareFormLinkProps {
  formId: string;
}

export const ShareFormLink: React.FC<ShareFormLinkProps> = ({ formId }) => {
  const [copied, setCopied] = useState(false);
  const formUrl = `${window.location.origin}/quiz/${formId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200">
      <div className="flex items-center gap-2 mb-3">
        <LinkIcon className="text-purple-600" size={20} />
        <h3 className="text-lg font-bold text-gray-800">Link thu thập câu trả lời</h3>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={formUrl}
          readOnly
          className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-700 font-mono text-sm"
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

      <p className="text-sm text-gray-600 mt-3">
        Chia sẻ link này để người dùng có thể trả lời form của bạn
      </p>
    </div>
  );
};
