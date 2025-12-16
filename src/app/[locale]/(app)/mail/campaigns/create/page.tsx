import React from 'react';
import { CampaignWizard } from '@/components/mail/campaigns/wizard/CampaignWizard';

export default function CampaignCreatePage() {
    return (
        <div className="h-full w-full bg-background overflow-y-auto">
            <CampaignWizard />
        </div>
    );
}
