import type { ComponentType } from "react";
import type { ColorValue } from "react-native";

export type IconComponent = ComponentType<{ color?: ColorValue; size?: number | string }>;
