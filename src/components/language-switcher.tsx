'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
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
    const searchParams = useSearchParams();

    const handleLocaleChange = (newLocale: string) => {
        // Build new path
        let newPath = pathname;
        const localePattern = /^\/(en|zh)(\/|$)/;

        if (localePattern.test(pathname)) {
            newPath = pathname.replace(localePattern, `/${newLocale}$2`);
        } else {
            newPath = `/${newLocale}${pathname}`;
        }

        // Preserve search params
        if (searchParams.size > 0) {
            newPath += `?${searchParams.toString()}`;
        }

        router.push(newPath);
        router.refresh();
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
