import { translate } from '@partner-os/i18n';
import { colors } from '@partner-os/ui';

export function HomePage(): React.JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <section className="p-8 text-center">
        <h1 className="text-2xl font-bold" style={{ color: colors.primary.DEFAULT }}>
          {translate('vi', 'appName')}
        </h1>
        <p className="mt-2 text-neutral-500">{translate('vi', 'nav.workers')}</p>
        <p className="mt-4 text-sm">{translate('vi', 'common.loading')}</p>
      </section>
    </main>
  );
}
