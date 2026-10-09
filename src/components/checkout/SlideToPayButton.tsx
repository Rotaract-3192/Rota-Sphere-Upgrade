"use client";

import React from "react";
import { HoldToConfirm } from "@/components/ui/motion-hold-to-confirm";

export interface SlideToPayButtonProps {
  onSuccess: () => void;
  label?: string;
  amount?: number;
  isFree?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function SlideToPayButton({
  onSuccess,
  label,
  amount,
  isFree = false,
  disabled = false,
  loading = false,
  className = "",
}: SlideToPayButtonProps) {
  return (
    <HoldToConfirm
      onConfirm={onSuccess}
      onSuccess={onSuccess}
      label={label}
      amount={amount}
      isFree={isFree}
      disabled={disabled}
      loading={loading}
      className={className}
    />
  );
}

export default SlideToPayButton;
