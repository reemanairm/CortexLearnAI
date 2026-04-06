import React from 'react';

const Loader = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center h-96">
    <div className="text-center">
      <div
        style={{ width: '3rem', height: '3rem', borderWidth: '2px' }}
        className="animate-spin rounded-full border-b-2 border-emerald-400 mx-auto mb-4"
      ></div>
      <p className="text-slate-400">{message}</p>
    </div>
  </div>
);

export default Loader;
