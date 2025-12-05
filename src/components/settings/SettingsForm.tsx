'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, User, Shield, Palette, Bell, Crown } from 'lucide-react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTheme } from 'next-themes';
import { format } from 'date-fns';

interface Profile {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    bio?: string;
    credits?: number;
    membership_tier?: string;
    membership_expires_at?: string;
}

export function SettingsForm() {
    const t = useTranslations('settings');
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<Profile | null>(null);
    const supabase = createClient();
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                setProfile({ ...data, email: user.email || '' });
            } else {
                setProfile({ id: user.id, email: user.email || '' });
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async () => {
        try {
            setUpgrading(true);
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'membership',
                    price: 19.99,
                    plan: 'pro'
                }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                toast.error(t('errorUpdating'));
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setUpgrading(false);
        }
    };

    const updateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: profile.id,
                    full_name: profile.full_name,
                    bio: profile.bio,
                    avatar_url: profile.avatar_url,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;
            toast.success(t('profileUpdated'));
        } catch (error: any) {
            toast.error(t('errorUpdating') + ': ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${profile?.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const toastId = toast.loading(t('uploading'));

        try {
            // 1. Upload to 'avatars' bucket
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                // Try 'public' bucket if 'avatars' fails (fallback)
                const { error: publicError } = await supabase.storage
                    .from('public')
                    .upload(`avatars/${filePath}`, file, { upsert: true });

                if (publicError) throw uploadError; // Throw original error if both fail
            }

            // 2. Get Public URL
            // Try getting URL from avatars bucket first
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

            // If we used fallback, fix URL (simplified logic)
            // Actually, the storage instance handles the URL generation based on bucket name.
            // We'll update the profile with this URL.

            // 3. Update Profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
                .eq('id', profile?.id);

            if (updateError) throw updateError;

            setProfile(prev => prev ? ({ ...prev, avatar_url: publicUrl }) : null);
            toast.success(t('uploadSuccess'), { id: toastId });
        } catch (error: any) {
            console.error('Avatar upload error:', error);
            toast.error(t('errorUpdating') + ': ' + (error.message || 'Unknown error'), { id: toastId });
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-[500px]">
                <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" />{t('profile')}</TabsTrigger>
                <TabsTrigger value="account"><Shield className="mr-2 h-4 w-4" />{t('account')}</TabsTrigger>
                <TabsTrigger value="membership"><Crown className="mr-2 h-4 w-4" />{t('membership')}</TabsTrigger>
                <TabsTrigger value="preferences"><Palette className="mr-2 h-4 w-4" />{t('preferences')}</TabsTrigger>
                <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" />{t('notifications')}</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('profile')}</CardTitle>
                        <CardDescription>{t('profile')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={updateProfile} className="space-y-6">
                            <div className="flex items-center gap-6">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={profile?.avatar_url} />
                                    <AvatarFallback>{profile?.email?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="avatar">{t('avatar')}</Label>
                                    <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} />
                                </div>
                            </div>

                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="displayName">{t('displayName')}</Label>
                                <Input
                                    id="displayName"
                                    value={profile?.full_name || ''}
                                    onChange={(e) => setProfile(prev => prev ? ({ ...prev, full_name: e.target.value }) : null)}
                                />
                            </div>

                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="bio">{t('bio')}</Label>
                                <Textarea
                                    id="bio"
                                    value={profile?.bio || ''}
                                    onChange={(e) => setProfile(prev => prev ? ({ ...prev, bio: e.target.value }) : null)}
                                />
                            </div>

                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('saveChanges')}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="account" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('account')}</CardTitle>
                        <CardDescription>{t('account')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label>{t('email')}</Label>
                            <Input value={profile?.email} disabled />
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-lg font-medium">{t('changePassword')}</h3>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="new-password">{t('newPassword')}</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    placeholder={t('newPassword')}
                                />
                            </div>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="confirm-password">{t('confirmPassword')}</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    placeholder={t('confirmPassword')}
                                />
                            </div>
                            <Button onClick={async () => {
                                const newPass = (document.getElementById('new-password') as HTMLInputElement).value;
                                const confirmPass = (document.getElementById('confirm-password') as HTMLInputElement).value;
                                if (!newPass) return toast.error("Password cannot be empty");
                                if (newPass !== confirmPass) return toast.error("Passwords do not match");

                                const { error } = await supabase.auth.updateUser({ password: newPass });
                                if (error) toast.error(error.message);
                                else {
                                    toast.success(t('passwordUpdated'));
                                    (document.getElementById('new-password') as HTMLInputElement).value = '';
                                    (document.getElementById('confirm-password') as HTMLInputElement).value = '';
                                }
                            }}>
                                {t('changePassword')}
                            </Button>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-lg font-medium text-destructive">{t('dangerZone')}</h3>
                            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                                <div>
                                    <h4 className="font-medium text-destructive">{t('deleteAccount')}</h4>
                                    <p className="text-sm text-destructive/80">{t('deleteAccountDesc')}</p>
                                </div>
                                <Button variant="destructive" onClick={() => {
                                    if (confirm(t('confirmDeleteAccount'))) {
                                        toast.error("Please contact support to delete your account.");
                                    }
                                }}>
                                    {t('deleteAccount')}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="membership" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('membership')}</CardTitle>
                        <CardDescription>{t('currentPlan')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-medium capitalize">
                                        {profile?.membership_tier === 'pro' ? t('proPlan') : t('freePlan')}
                                    </h3>
                                    {profile?.membership_tier === 'pro' && <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">Pro</span>}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {t('creditsBalance')}: <span className="font-mono font-medium text-foreground">{profile?.credits || 0}</span>
                                </p>
                                {profile?.membership_tier === 'pro' && profile?.membership_expires_at && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {t('expiresOn')}: {format(new Date(profile.membership_expires_at), 'yyyy-MM-dd')}
                                    </p>
                                )}
                            </div>
                            <Button onClick={handleUpgrade} disabled={upgrading}>
                                {upgrading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {profile?.membership_tier === 'pro' ? t('renewMembership') : t('upgradeToPro')}
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-medium">
                                {profile?.membership_tier === 'pro' ? t('proPlan') : t('freePlan')}
                            </h4>
                            <ul className="grid gap-2 text-sm text-muted-foreground">
                                {(profile?.membership_tier === 'pro' ?
                                    [0, 1, 2, 3] :
                                    [0, 1, 2]
                                ).map((i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                        {t(`planFeatures.${profile?.membership_tier === 'pro' ? 'pro' : 'free'}.${i}`)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('preferences')}</CardTitle>
                        <CardDescription>{t('preferences')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between max-w-sm">
                            <Label>{t('language')}</Label>
                            <LanguageSwitcher />
                        </div>
                        <div className="flex items-center justify-between max-w-sm">
                            <Label>{t('theme')}</Label>
                            <div className="flex gap-2">
                                <Button variant={theme === 'light' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('light')}>{t('themeLight')}</Button>
                                <Button variant={theme === 'dark' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('dark')}>{t('themeDark')}</Button>
                                <Button variant={theme === 'system' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('system')}>{t('themeSystem')}</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('notifications')}</CardTitle>
                        <CardDescription>{t('emailNotificationsDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <Switch id="email-notifications" />
                            <Label htmlFor="email-notifications">{t('emailNotifications')}</Label>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
