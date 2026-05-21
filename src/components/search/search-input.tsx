"use client";

import { useRef } from "react";

export default function SearchInput({
  name,
  defaultValue,
  placeholder,
  className,
}: {
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement | null>(null);

  return (
    <input
      ref={ref}
      name={name}
      defaultValue={defaultValue ?? undefined}
      placeholder={placeholder}
      className={className}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      aria-autocomplete="none"
      readOnly
      onFocus={(e) => {
        // Remove readOnly on first focus to avoid browser autofill suggestions
        e.currentTarget.readOnly = false;
      }}
    />
  );
}
