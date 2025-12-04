import { redirect } from 'next/navigation';
import { defaultLocale } from '@/i18n';

// 根路径重定向到默认语言
export default function RootPage() {
    redirect(`/${defaultLocale}`);
}
