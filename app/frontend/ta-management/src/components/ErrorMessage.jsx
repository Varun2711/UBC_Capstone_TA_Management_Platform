// Splitting out an error message as it's own component.
// This is resuable!
// error - an error message
//className - optional tailwind formatting

import React from "react";

const ErrorMessage = ({ error, className = "" }) => {
  if (!error) return null;

  return <p className={`text-red-600 text-sm mt-1 ${className}`}>{error}</p>;
};

export default ErrorMessage;
