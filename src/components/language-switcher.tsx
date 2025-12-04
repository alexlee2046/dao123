'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales } from '@/i18n';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const handleLocaleChange = (newLocale: string) => {
        // 获取当前路径，去除语言前缀
        const pathWithoutLocale = pathname.replace(/^\/(en|zh)/, '');
        // 构建新的 URL
        const newPath = `/${newLocale}${pathWithoutLocale}`;
        router.push(newPath);
    };

    const languageNames: Record<string, string> = {
        en: 'English',
        zh: '中文',
    };

    return (
        <Select value={locale} onValueChange={handleLocaleChange}>
            <SelectTrigger className="w-[140px]">
                <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <SelectValue />
                </div>
            </SelectTrigger>
            <SelectContent>
                {locales.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                        {languageNames[loc]}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
