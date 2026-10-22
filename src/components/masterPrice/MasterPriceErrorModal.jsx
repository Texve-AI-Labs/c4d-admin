import React from 'react';

const MasterPriceErrorModal = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-red-700">Unable to save master price</h2>
          <button type="button" onClick={onClose} className="text-2xl leading-none text-gray-500" aria-label="Close error">&times;</button>
        </div>
        <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700">{message}</p>
        <button type="button" onClick={onClose} className="mt-6 w-full rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700">
          Close
        </button>
      </div>
    </div>
  );
};

export default MasterPriceErrorModal;
