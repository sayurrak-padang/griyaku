import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';

import { Button, Field } from '@/components/ui';
import { C } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

export default function Login() {
  const { login } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const digits = phone.replace(/\D/g, '');
  const valid = name.trim().length >= 2 && digits.length >= 9;

  const submit = () => {
    const normalized = digits.startsWith('0') ? '62' + digits.slice(1) : digits.startsWith('62') ? digits : '62' + digits;
    login({ name: name.trim(), phone: normalized });
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.card }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 22, fontWeight: '800', color: C.text }}>Selamat datang di Griyaku</Text>
        <Text style={{ fontSize: 14, color: C.muted, marginTop: 6, marginBottom: 24, lineHeight: 20 }}>
          Masuk dengan nama dan nomor HP. Di versi ini belum ada kode OTP, data hanya tersimpan di HP Anda.
        </Text>
        <Field label="Nama lengkap" value={name} onChangeText={setName} placeholder="Nama Anda" autoCapitalize="words" />
        <Field
          label="Nomor HP / WhatsApp"
          value={phone}
          onChangeText={setPhone}
          placeholder="08xxxxxxxxxx"
          keyboardType="phone-pad"
        />
        <Button title="Masuk" onPress={submit} disabled={!valid} style={{ marginTop: 8 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
