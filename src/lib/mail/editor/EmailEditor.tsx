'use client';

import React from 'react';
import { EmailEditor, EmailEditorProvider, IEmailTemplate } from 'easy-email-editor';
import { StandardLayout } from 'easy-email-extensions';
import 'easy-email-editor/lib/style.css';
import 'easy-email-extensions/lib/style.css';
import { AdvancedType } from 'easy-email-core';
import { saveTemplate } from '@/lib/actions/mail/templates';

// Initial Template
const initialValues: IEmailTemplate = {
    subject: 'Welcome to DaoMail',
    subTitle: 'Nice to meet you',
    content: {
        type: 'page',
        attributes: {
            'background-color': '#f4f4f4',
            width: '600px',
        },
        data: {
            value: {
                breakpoint: '480px',
                headAttributes: '',
                'font-family': 'sans-serif',
                'font-weight': '400',
                'line-height': '1.7',
                'font-size': '14px',
                'text-color': '#000000',
                fonts: [],
                responsive: true,
            },
        },
        children: [
            {
                type: 'section',
                attributes: {
                    'background-color': '#ffffff',
                    padding: '20px 0px 20px 0px',
                },
                data: {
                    value: {},
                },
                children: [
                    {
                        type: 'column',
                        attributes: {
                            padding: '0px 0px 0px 0px',
                            border: 'none',
                        },
                        data: {
                            value: {},
                        },
                        children: [
                            {
                                type: 'text',
                                attributes: {
                                    padding: '0px 0px 0px 0px',
                                    'font-size': '24px',
                                    align: 'center',
                                },
                                data: {
                                    value: {
                                        content: 'Hello {{first_name}}!',
                                    }
                                },
                                children: []
                            }
                        ]
                    }
                ]
            }
        ]
    },
};

const mergeTags = {
    User: [
        { label: 'First Name', value: '{{first_name}}', sample: 'John' },
        { label: 'Last Name', value: '{{last_name}}', sample: 'Doe' },
        { label: 'Position', value: '{{position}}', sample: 'CEO' },
    ],
    Company: [
        { label: 'Company Name', value: '{{company_name}}', sample: 'Tesla' },
    ],
    Links: [
        { label: 'Unsubscribe', value: '{{unsubscribe_url}}', sample: 'https://...' },
    ]
};

export default function DaoMailEditor() {
    const onUploadImage = async (blob: Blob) => {
        // Implement image upload if needed
        return URL.createObjectURL(blob);
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <EmailEditorProvider
                data={initialValues}
                height={'calc(100vh - 60px)'}
                autoComplete
                dashed={false}
                mergeTags={mergeTags}
                onUploadImage={onUploadImage}
            >
                {({ values }, { submit }) => {
                    const handleSave = async () => {
                        const name = prompt('Enter template name:', values.subject);
                        if (name) {
                            try {
                                await saveTemplate({
                                    name,
                                    content_json: values.content,
                                    thumbnail: '' // Todo: Generate thumbnail
                                });
                                alert('Saved!');
                            } catch (e: any) {
                                alert('Error: ' + e.message);
                            }
                        }
                    };

                    return (
                        <>
                            <div className="flex h-[60px] items-center justify-between border-b px-4 bg-white">
                                <h1 className="text-lg font-bold">DaoMail Editor</h1>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSave}
                                        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                                    >
                                        Save as Template
                                    </button>
                                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                        Next: Campaign Config
                                    </button>
                                </div>
                            </div>

                            <StandardLayout
                                compact={false}
                                categories={defaultCategories}
                            >
                                <EmailEditor />
                            </StandardLayout>
                        </>
                    );
                }}
            </EmailEditorProvider>
        </div>
    );
}

const defaultCategories = [
    {
        label: 'Content',
        active: true,
        blocks: [
            {
                type: AdvancedType.TEXT,
            },
            {
                type: AdvancedType.IMAGE,
            },
            {
                type: AdvancedType.BUTTON,
            },
            {
                type: AdvancedType.SOCIAL,
            },
            {
                type: AdvancedType.DIVIDER,
            },
            {
                type: AdvancedType.SPACER,
            },
            {
                type: AdvancedType.HERO,
            },
            {
                type: AdvancedType.WRAPPER,
            },
        ],
    },
    {
        label: 'Layout',
        active: true,
        blocks: [
            {
                type: AdvancedType.SECTION,
            },
            {
                type: AdvancedType.COLUMN,
            },
            {
                type: AdvancedType.GROUP,
            },
        ],
    },
];
