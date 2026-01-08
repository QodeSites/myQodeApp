import { cn } from "@/lib/utils";
import React from "react";
import { Text, TouchableOpacity } from "react-native";

type ButtonProps = {
  onPress: () => void;
  children: React.ReactNode;
  className?: string;
  style?: object;
  disabled?: boolean;
  variant?: "primary"| "secondary" | "default" | "outline" | "ghost" | "destructive" | "link";
  size?: "sm" | "md" | "lg";
};

const variantClassMap: Record<
  NonNullable<ButtonProps["variant"]>,
  string
> = {
  primary : "bg-primary text-white border border-gray-300",
  secondary: "bg-primary text-accent border border-primary-300",
  default: "bg-primary text-white border border-gray-300",
  outline: "bg-transparent border border-primary text-primary",
  ghost: "bg-transparent border-0 text-primary",
  destructive: "bg-destructive text-white border border-destructive",
  link: "bg-transparent border-0 text-primary underline underline-offset-4 px-0", // Added 'link' variant
};

const sizeClassMap: Record<
  NonNullable<ButtonProps["size"]>,
  string
> = {
  sm: "p-2 text-sm rounded",
  md: "p-2.5 text-base rounded-md",
  lg: "p-3 text-lg rounded-lg",
};

export function Button({
  onPress,
  children,
  className,
  style,
  disabled = false,
  variant = "default",
  size = "md",
}: ButtonProps) {
  // Merge variant, size, and custom className
  const classes = cn(
    variantClassMap[variant],
    sizeClassMap[size],
    "h-content items-center",
    className
  );

  // Choose contrasting text color for variants (basic heuristic)
  const textColor =
    variant === "outline" || variant === "ghost" || variant === "link"
      ? "text-primary"
      : variant === "destructive"
      ? "text-white"
      : "text-white";

  return (
    <TouchableOpacity
      onPress={onPress}
      className={classes}
      style={style}
      disabled={disabled}
      accessibilityRole="button"
      activeOpacity={disabled ? 1 : 0.7}
    >
      <Text className={textColor}>{children}</Text>
    </TouchableOpacity>
  );
}
