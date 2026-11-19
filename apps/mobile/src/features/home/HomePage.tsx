import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { translate } from '@partner-os/i18n';
import { colors, spacing, typography } from '@partner-os/ui';

export function HomePage(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{translate('vi', 'appName')}</Text>
      <Text style={styles.subtitle}>{translate('vi', 'common.offline')}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.neutral.light,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.primary.DEFAULT,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.neutral.gray,
  },
});
