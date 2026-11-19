import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing, typography } from '@partner-os/ui';

export interface LoginPageProps {
  onSignIn: (email: string, password: string) => Promise<void>;
}

export function LoginPage({ onSignIn }: LoginPageProps): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !submitting && email.trim() !== '' && password !== '';

  const submit = async (): Promise<void> => {
    setSubmitting(true);
    setError(null);
    try {
      await onSignIn(email.trim(), password);
    } catch (unexpected: unknown) {
      setError(unexpected instanceof Error ? unexpected.message : 'Đăng nhập thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng nhập</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        editable={!submitting}
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!submitting}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={[styles.button, !canSubmit && styles.buttonDisabled]}
        onPress={() => void submit()}
        disabled={!canSubmit}
      >
        {submitting ? (
          <ActivityIndicator color={colors.neutral.white} />
        ) : (
          <Text style={styles.buttonText}>Đăng nhập</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.neutral.white,
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: '600',
    color: colors.neutral.black,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: typography.size.md,
  },
  error: { color: colors.danger.DEFAULT, fontSize: typography.size.sm },
  button: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: colors.neutral.white,
    fontWeight: '600',
    fontSize: typography.size.md,
  },
});
