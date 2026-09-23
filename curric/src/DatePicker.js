import React, { useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { prettyDate } from './plan';

const pad = (n) => String(n).padStart(2, '0');
const toDate = (iso) => {
  if (!iso) return new Date();
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const toIso = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Picks a 'YYYY-MM-DD' date: the browser's calendar on web, native pickers on phones.
export default function DatePicker({ value, onChange, placeholder = 'Pick a date', style }) {
  const [open, setOpen] = useState(false);

  if (Platform.OS === 'web') {
    return React.createElement('input', {
      type: 'date',
      value: value || '',
      onChange: (e) => e.target.value && onChange(e.target.value),
      style: {
        font: 'inherit', fontSize: 15, padding: 9, borderRadius: 8, minWidth: 0,
        border: '1px solid #D5DCE8', background: '#fff', color: '#22304A', ...style,
      },
    });
  }

  if (Platform.OS === 'ios') {
    return (
      <View style={[{ alignItems: 'flex-start' }, style]}>
        <DateTimePicker value={toDate(value)} mode="date" display="compact"
          onChange={(_, date) => date && onChange(toIso(date))} />
      </View>
    );
  }

  return (
    <View style={style}>
      <TouchableOpacity onPress={() => setOpen(true)}
        style={{ borderWidth: 1, borderColor: '#D5DCE8', borderRadius: 8, padding: 10, backgroundColor: '#fff' }}>
        <Text style={{ color: value ? '#22304A' : '#8A94A8' }}>{value ? prettyDate(value) : placeholder}</Text>
      </TouchableOpacity>
      {open && (
        <DateTimePicker value={toDate(value)} mode="date"
          onChange={(event, date) => {
            setOpen(false);
            if (event.type === 'set' && date) onChange(toIso(date));
          }} />
      )}
    </View>
  );
}
