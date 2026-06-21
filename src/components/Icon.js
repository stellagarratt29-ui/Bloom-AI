import React from 'react';
import { Feather } from '@expo/vector-icons';

export default function Icon({ name, size = 20, color = '#2D4A35', style }) {
  return <Feather name={name} size={size} color={color} style={style} />;
}
