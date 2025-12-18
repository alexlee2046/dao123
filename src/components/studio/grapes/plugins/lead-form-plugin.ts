/**
 * GrapesJS Lead Capture Form Plugin
 *
 * Adds a pre-configured lead capture form component to GrapesJS
 * that integrates with Dao123's form submission API.
 */

import type { Editor, Component } from 'grapesjs';

export interface LeadFormPluginOptions {
  category?: string;
  labelBlock?: string;
  apiEndpoint?: string;
}

const DEFAULT_OPTIONS: LeadFormPluginOptions = {
  category: 'Forms',
  labelBlock: 'Lead Capture Form',
  apiEndpoint: '/api/forms/submit',
};

/**
 * Generate the form HTML template
 */
function generateFormHtml(formId: string = 'new'): string {
  return `
    <div class="dao-lead-form" data-form-id="${formId}" style="max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div class="dao-form-header" style="margin-bottom: 24px; text-align: center;">
        <h3 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #111827;">Get in Touch</h3>
        <p style="margin: 0; font-size: 14px; color: #6b7280;">Fill out the form below and we'll get back to you shortly.</p>
      </div>
      <form class="dao-form-body" data-form-handler="lead-capture">
        <div class="dao-form-field" style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 500; color: #374151;">Full Name *</label>
          <input type="text" name="name" placeholder="Your name" required style="width: 100%; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; transition: border-color 0.2s; box-sizing: border-box;" />
        </div>
        <div class="dao-form-field" style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 500; color: #374151;">Email Address *</label>
          <input type="email" name="email" placeholder="you@example.com" required style="width: 100%; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; transition: border-color 0.2s; box-sizing: border-box;" />
        </div>
        <div class="dao-form-field" style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 500; color: #374151;">Company</label>
          <input type="text" name="company" placeholder="Your company" style="width: 100%; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; transition: border-color 0.2s; box-sizing: border-box;" />
        </div>
        <div class="dao-form-field" style="margin-bottom: 24px;">
          <label style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 500; color: #374151;">Message</label>
          <textarea name="message" rows="3" placeholder="How can we help?" style="width: 100%; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; resize: vertical; box-sizing: border-box;"></textarea>
        </div>
        <button type="submit" style="width: 100%; padding: 14px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
          Send Message
        </button>
      </form>
      <div class="dao-form-success" style="display: none; text-align: center; padding: 24px;">
        <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          <svg width="32" height="32" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h4 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #111827;">Thank you!</h4>
        <p style="margin: 0; font-size: 14px; color: #6b7280;">We'll be in touch soon.</p>
      </div>
    </div>
  `;
}

/**
 * Generate the form submission script
 */
function generateFormScript(apiEndpoint: string): string {
  return `
    <script>
    (function() {
      document.querySelectorAll('.dao-lead-form form[data-form-handler="lead-capture"]').forEach(function(form) {
        if (form.dataset.initialized) return;
        form.dataset.initialized = 'true';

        form.addEventListener('submit', async function(e) {
          e.preventDefault();

          const formContainer = form.closest('.dao-lead-form');
          const formId = formContainer?.dataset.formId || 'inline';
          const submitBtn = form.querySelector('button[type="submit"]');
          const originalText = submitBtn?.textContent || 'Submit';

          // Disable button
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
          }

          // Collect form data
          const formData = new FormData(form);
          const data = {};
          formData.forEach((value, key) => {
            data['field_' + key] = value;
          });

          try {
            const response = await fetch('${apiEndpoint}', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                formId: formId,
                data: data,
                metadata: {
                  referrer: document.referrer,
                  url: window.location.href
                }
              })
            });

            const result = await response.json();

            if (result.success) {
              // Show success message
              const formBody = formContainer?.querySelector('.dao-form-body');
              const formHeader = formContainer?.querySelector('.dao-form-header');
              const successMsg = formContainer?.querySelector('.dao-form-success');

              if (formBody) formBody.style.display = 'none';
              if (formHeader) formHeader.style.display = 'none';
              if (successMsg) successMsg.style.display = 'block';
            } else {
              alert(result.error || 'Something went wrong. Please try again.');
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
              }
            }
          } catch (error) {
            console.error('Form submission error:', error);
            alert('Network error. Please try again.');
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = originalText;
            }
          }
        });
      });
    })();
    </script>
  `;
}

/**
 * Lead Form GrapesJS Plugin
 */
export default function leadFormPlugin(editor: Editor, opts: LeadFormPluginOptions = {}) {
  const options = { ...DEFAULT_OPTIONS, ...opts };
  const { category, labelBlock, apiEndpoint } = options;

  // Register component type
  editor.DomComponents.addType('dao-lead-form', {
    isComponent: (el: HTMLElement) => {
      return el.classList?.contains('dao-lead-form');
    },
    model: {
      defaults: {
        tagName: 'div',
        draggable: true,
        droppable: false,
        copyable: true,
        name: 'Lead Form',
        attributes: {
          class: 'dao-lead-form',
          'data-form-id': 'new',
        },
        traits: [
          {
            type: 'text',
            name: 'data-form-id',
            label: 'Form ID',
            placeholder: 'Form ID (leave empty for inline)',
          },
          {
            type: 'text',
            name: 'formTitle',
            label: 'Form Title',
            changeProp: true,
          },
          {
            type: 'text',
            name: 'formDescription',
            label: 'Description',
            changeProp: true,
          },
          {
            type: 'text',
            name: 'buttonText',
            label: 'Button Text',
            changeProp: true,
          },
          {
            type: 'color',
            name: 'buttonColor',
            label: 'Button Color',
            changeProp: true,
          },
        ],
        // Custom properties
        formTitle: 'Get in Touch',
        formDescription: "Fill out the form below and we'll get back to you shortly.",
        buttonText: 'Send Message',
        buttonColor: '#3b82f6',
      },
      init() {
        // Listen for trait changes
        this.on('change:formTitle', this.updateContent);
        this.on('change:formDescription', this.updateContent);
        this.on('change:buttonText', this.updateContent);
        this.on('change:buttonColor', this.updateContent);
      },
      updateContent() {
        const title = this.get('formTitle') || 'Get in Touch';
        const desc = this.get('formDescription') || '';
        const btnText = this.get('buttonText') || 'Send Message';
        const btnColor = this.get('buttonColor') || '#3b82f6';

        // Update DOM elements
        const el = this.getEl();
        if (!el) return;

        const titleEl = el.querySelector('.dao-form-header h3');
        const descEl = el.querySelector('.dao-form-header p');
        const btnEl = el.querySelector('button[type="submit"]') as HTMLButtonElement;

        if (titleEl) titleEl.textContent = title;
        if (descEl) descEl.textContent = desc;
        if (btnEl) {
          btnEl.textContent = btnText;
          btnEl.style.background = btnColor;
        }
      },
    },
    view: {
      onRender() {
        // Add visual indicator for editor
        const el = this.el;
        el.style.position = 'relative';

        // Prevent form submission in editor
        const form = el.querySelector('form');
        if (form) {
          form.addEventListener('submit', (e: Event) => e.preventDefault());
        }

        // Add edit overlay hint on hover (only in editor)
        el.addEventListener('mouseenter', () => {
          el.style.outline = '2px dashed #3b82f6';
          el.style.outlineOffset = '4px';
        });
        el.addEventListener('mouseleave', () => {
          el.style.outline = 'none';
        });
      },
    },
  });

  // Register block
  editor.BlockManager.add('dao-lead-form', {
    label: labelBlock || 'Lead Capture Form',
    category: category || 'Forms',
    media: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="7" y1="8" x2="17" y2="8" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <rect x="7" y="16" width="10" height="2" rx="1" fill="currentColor" />
    </svg>`,
    content: {
      type: 'dao-lead-form',
      content: generateFormHtml('new'),
    },
    activate: true,
  });

  // Add newsletter form variant
  editor.BlockManager.add('dao-newsletter-form', {
    label: 'Newsletter Signup',
    category: category,
    media: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M2 8l10 5 10-5" />
    </svg>`,
    content: `
      <div class="dao-lead-form dao-newsletter-form" data-form-id="newsletter" style="max-width: 560px; margin: 0 auto; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; text-align: center;">
        <div class="dao-form-header" style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: white;">Subscribe to our Newsletter</h3>
          <p style="margin: 0; font-size: 16px; color: rgba(255,255,255,0.9);">Get the latest updates delivered to your inbox.</p>
        </div>
        <form class="dao-form-body" data-form-handler="lead-capture" style="display: flex; gap: 12px; max-width: 420px; margin: 0 auto;">
          <input type="email" name="email" placeholder="Enter your email" required style="flex: 1; padding: 14px 20px; border: none; border-radius: 8px; font-size: 16px; box-sizing: border-box;" />
          <button type="submit" style="padding: 14px 28px; background: #111827; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; white-space: nowrap;">
            Subscribe
          </button>
        </form>
        <div class="dao-form-success" style="display: none; padding: 24px;">
          <h4 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: white;">You're subscribed!</h4>
          <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.9);">Check your inbox for a confirmation.</p>
        </div>
      </div>
    `,
    activate: true,
  });

  // Add contact form variant
  editor.BlockManager.add('dao-contact-form', {
    label: 'Contact Form',
    category: category,
    media: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>`,
    content: generateFormHtml('contact'),
    activate: true,
  });

  // Inject form handler script when exporting
  editor.on('run:export-template:before', (opts: any) => {
    // The form script will be added to exported HTML
  });

  // Add custom command to get form script
  editor.Commands.add('dao:get-form-script', {
    run: () => {
      return generateFormScript(apiEndpoint!);
    },
  });

  console.log('[LeadFormPlugin] Plugin initialized');
}
