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

/** Login sungguhan: email → kode 6 digit → lengkapi profil */
function EmailLogin() {
  const { saveProfile } = useApp();
  const [step, setStep] = useState<'email' | 'code' | 'profile'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      Alert.alert('Gagal', e instanceof Error ? e.message : 'Terjadi kesalahan, coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());

  if (step === 'email') {
    return (
      <>
        <Title title="Masuk ke Griyaku" text="Masukkan email Anda. Kami akan mengirim kode 6 digit untuk masuk, tanpa kata sandi." />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="nama@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <Button
          title={busy ? 'Mengirim...' : 'Kirim kode'}
          disabled={!emailOk || busy}
          onPress={() =>
            run(async () => {
              await api.sendEmailCode(email.trim().toLowerCase());
              setStep('code');
            })
          }
        />
      </>
    );
  }

  if (step === 'code') {
    return (
      <>
        <Title title="Masukkan kode" text={`Kode sudah dikirim ke ${email.trim()}. Cek juga folder Spam.`} />
        <Field
          label="Kode verifikasi"
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 8))}
          placeholder="123456"
          keyboardType="number-pad"
          autoComplete="one-time-code"
        />
        <Button
          title={busy ? 'Memeriksa...' : 'Verifikasi'}
          disabled={code.length < 6 || busy}
          onPress={() =>
            run(async () => {
              const user = await api.verifyEmailCode(email.trim().toLowerCase(), code);
              const prof = user ? await api.fetchProfile(user.id) : null;
              if (prof?.name) router.back();
              else setStep('profile');
            })
          }
        />
        <Pressable onPress={() => setStep('email')} style={{ marginTop: 16, alignItems: 'center' }}>
          <Text style={{ color: C.primary, fontWeight: '700' }}>Ganti email / kirim ulang</Text>
        </Pressable>
      </>
    );
  }

  return (
    <>
      <Title title="Lengkapi profil" text="Nama dan nomor WhatsApp dipakai untuk iklan dan pesanan jasa Anda." />
      <Field label="Nama lengkap" value={name} onChangeText={setName} placeholder="Nama Anda" autoCapitalize="words" />
      <Field label="Nomor WhatsApp" value={phone} onChangeText={setPhone} placeholder="08xxxxxxxxxx" keyboardType="phone-pad" />
      {busy ? <ActivityIndicator color={C.primary} /> : null}
      <Button
        title="Simpan"
        disabled={name.trim().length < 2 || phone.replace(/\D/g, '').length < 9 || busy}
        onPress={() =>
          run(async () => {
            await saveProfile(name.trim(), toIntl(phone));
            router.back();
          })
        }
      />
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
