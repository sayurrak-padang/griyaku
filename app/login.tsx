import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text } from 'react-native';

import { Button, Field } from '@/components/ui';
import { C } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import * as api from '@/lib/api';

const toIntl = (phone: string) => {
  const d = phone.replace(/\D/g, '');
  return d.startsWith('0') ? '62' + d.slice(1) : d.startsWith('62') ? d : '62' + d;
};

export default function Login() {
  const { online } = useApp();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.card }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        {online ? <EmailLogin /> : <LocalLogin />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Title({ title, text }: { title: string; text: string }) {
  return (
    <>
      <Text style={{ fontSize: 22, fontWeight: '800', color: C.text }}>{title}</Text>
      <Text style={{ fontSize: 14, color: C.muted, marginTop: 6, marginBottom: 24, lineHeight: 20 }}>{text}</Text>
    </>
  );
}

/** Login sungguhan: email + kata sandi. Daftar sekaligus mengisi nama & WhatsApp. */
function EmailLogin() {
  const { saveProfile } = useApp();
  const [mode, setMode] = useState<'masuk' | 'daftar'>('masuk');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);

  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
  const valid =
    emailOk &&
    password.length >= 6 &&
    (mode === 'masuk' || (name.trim().length >= 2 && phone.replace(/\D/g, '').length >= 9));

  const submit = async () => {
    setBusy(true);
    try {
      const e = email.trim().toLowerCase();
      if (mode === 'masuk') {
        await api.signInWithPassword(e, password);
      } else {
        const res = await api.signUpWithPassword(e, password);
        if (!res.session) {
          Alert.alert(
            'Konfirmasi email aktif',
            'Akun dibuat, tetapi Supabase meminta konfirmasi email. Matikan "Confirm email" di Authentication → Sign In / Providers → Email, lalu masuk lagi.'
          );
          return;
        }
        await saveProfile(name.trim(), toIntl(phone));
      }
      router.back();
    } catch (err) {
      Alert.alert('Gagal', api.authErrorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Title
        title={mode === 'masuk' ? 'Masuk ke Griyaku' : 'Buat akun Griyaku'}
        text={
          mode === 'masuk'
            ? 'Masuk untuk memasang iklan, menyimpan favorit, dan memesan jasa.'
            : 'Nama dan nomor WhatsApp dipakai untuk iklan dan pesanan jasa Anda.'
        }
      />
      {mode === 'daftar' ? (
        <>
          <Field label="Nama lengkap" value={name} onChangeText={setName} placeholder="Nama Anda" autoCapitalize="words" />
          <Field label="Nomor WhatsApp" value={phone} onChangeText={setPhone} placeholder="08xxxxxxxxxx" keyboardType="phone-pad" />
        </>
      ) : null}
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="nama@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <Field
        label="Kata sandi"
        value={password}
        onChangeText={setPassword}
        placeholder="Minimal 6 karakter"
        secureTextEntry
        autoCapitalize="none"
        autoComplete={mode === 'masuk' ? 'current-password' : 'new-password'}
      />
      {busy ? <ActivityIndicator color={C.primary} style={{ marginBottom: 12 }} /> : null}
      <Button title={mode === 'masuk' ? 'Masuk' : 'Daftar'} disabled={!valid || busy} onPress={submit} />
      <Pressable onPress={() => setMode(mode === 'masuk' ? 'daftar' : 'masuk')} style={{ marginTop: 18, alignItems: 'center' }}>
        <Text style={{ color: C.muted }}>
          {mode === 'masuk' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
          <Text style={{ color: C.primary, fontWeight: '700' }}>{mode === 'masuk' ? 'Daftar' : 'Masuk'}</Text>
        </Text>
      </Pressable>
    </>
  );
}

/** Mode tanpa database: data hanya di HP */
function LocalLogin() {
  const { login } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const valid = name.trim().length >= 2 && phone.replace(/\D/g, '').length >= 9;

  return (
    <>
      <Title
        title="Selamat datang di Griyaku"
        text="Mode uji coba: masuk dengan nama dan nomor HP. Data hanya tersimpan di HP ini sampai database disambungkan."
      />
      <Field label="Nama lengkap" value={name} onChangeText={setName} placeholder="Nama Anda" autoCapitalize="words" />
      <Field label="Nomor HP / WhatsApp" value={phone} onChangeText={setPhone} placeholder="08xxxxxxxxxx" keyboardType="phone-pad" />
      <Button
        title="Masuk"
        disabled={!valid}
        style={{ marginTop: 8 }}
        onPress={() => {
          login({ name: name.trim(), phone: toIntl(phone) });
          router.back();
        }}
      />
    </>
  );
}
