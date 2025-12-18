
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, HelpCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailVerifyBadgeProps {
    verified?: boolean;
    status?: string | null;
    score?: number;
    className?: string;
}

export function EmailVerifyBadge({ verified, status, className }: EmailVerifyBadgeProps) {
    // 如果明确已验证
    if (verified === true) {
        return (
            <Badge variant="default" className={cn("bg-green-500/20 text-green-600 border-green-500/30 hover:bg-green-500/30", className)}>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                已验证
            </Badge>
        );
    }

    // 如果状态是 invalid
    if (status === 'invalid') {
        return (
            <Badge variant="destructive" className={cn("bg-red-500/20 text-red-600 border-red-500/30 hover:bg-red-500/30", className)}>
                <XCircle className="h-3 w-3 mr-1" />
                无效
            </Badge>
        );
    }

    // 如果状态是 accept_all (全部接受，风险较高)
    if (status === 'accept_all') {
        return (
            <Badge variant="secondary" className={cn("bg-yellow-500/20 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/30", className)}>
                <AlertCircle className="h-3 w-3 mr-1" />
                接受所有
            </Badge>
        );
    }

    // 未知或未验证
    return (
        <Badge variant="secondary" className={cn("text-muted-foreground", className)}>
            <HelpCircle className="h-3 w-3 mr-1" />
            未验证
        </Badge>
    );
}
