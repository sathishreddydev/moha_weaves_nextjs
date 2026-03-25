'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { ChangeEvent, useTransition } from 'react';

export default function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = event.target.value;
    startTransition(() => {
      router.replace(`/${nextLocale}${pathname}`);
    });
  };

  return (
    <select 
      className="px-3 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      defaultValue={locale} 
      onChange={handleChange}
      disabled={isPending}
    >
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="fr">Français</option>
      <option value="de">Deutsch</option>
      <option value="it">Italiano</option>
      <option value="pt">Português</option>
      <option value="nl">Nederlands</option>
      <option value="ja">日本語</option>
      <option value="zh">中文</option>
      <option value="ko">한국어</option>
      <option value="ar">العربية</option>
      <option value="hi">हिन्दी</option>
      <option value="te">తెలుగు</option>
    </select>
  );
}
