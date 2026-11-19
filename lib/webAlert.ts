// Di web, Alert.alert dari React Native tidak melakukan apa-apa. Ganti dengan dialog browser
// supaya semua konfirmasi & pesan di aplikasi tetap muncul.
import { Alert, AlertButton, Platform } from 'react-native';

let installed = false;

export function installWebAlert() {
  if (installed || Platform.OS !== 'web' || typeof window === 'undefined') return;
  installed = true;
  Alert.alert = (title: string, message?: string, buttons?: AlertButton[]) => {
    const text = [title, message].filter(Boolean).join('\n\n');
    const list = buttons?.length ? buttons : [{ text: 'OK' }];
    if (list.length === 1) {
      window.alert(text);
      list[0].onPress?.();
      return;
    }
    const cancel = list.find((b) => b.style === 'cancel') ?? list[0];
    const ok = [...list].reverse().find((b) => b !== cancel) ?? list[list.length - 1];
    if (window.confirm(`${text}\n\nOK = ${ok.text ?? 'OK'}  ·  Batal = ${cancel.text ?? 'Batal'}`)) ok.onPress?.();
    else cancel.onPress?.();
  };
}
