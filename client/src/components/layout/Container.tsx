import React from "react";

/**
 * Responsive content wrapper that:
 * 1. Keeps full-width on phones while adding comfortable side padding.
 * 2. Caps maximum width on very large screens to prevent unreadably long lines.
 * 3. Applies consistent horizontal padding that scales with breakpoints.
 */
const Container: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-screen-2xl">
    {children}
  </div>
);

export default Container;
