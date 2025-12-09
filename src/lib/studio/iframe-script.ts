
export const IFRAME_SCRIPT = `
<script>
    (function(){
        const intercept = (url) => {
            if (!url) return;
            const href = typeof url === 'string' ? url : String(url);
            if (href.startsWith('#')) return;
            if (href.startsWith('http://') || href.startsWith('https://')) {
                window.parent.postMessage({ type: 'notify', kind: 'external', href }, '*');
                return;
            }
            window.parent.postMessage({ type: 'navigate', path: href }, '*');
        };

        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;
            const href = link.getAttribute('href');
            const target = link.getAttribute('target');
            if (target === '_blank') {
                e.preventDefault();
                window.parent.postMessage({ type: 'notify', kind: 'external', href }, '*');
                return;
            }
            if (!href) return;
            if (href.startsWith('#')) return;
            e.preventDefault();
            e.stopPropagation();
            intercept(href);
        }, true);

        document.addEventListener('submit', (e) => {
            e.preventDefault();
            window.parent.postMessage({ type: 'notify', kind: 'form' }, '*');
        }, true);

        const origPush = history.pushState.bind(history);
        history.pushState = function(state, title, url) { if (url) intercept(url); };
        const origReplace = history.replaceState.bind(history);
        history.replaceState = function(state, title, url) { if (url) intercept(url); };
        const origOpen = window.open;
        window.open = function(url, target) { if (url) intercept(url); return null; };
        const origAssign = window.location.assign.bind(window.location);
        window.location.assign = function(url) { if (url) intercept(url); };
        const origLocReplace = window.location.replace.bind(window.location);
        window.location.replace = function(url) { if (url) intercept(url); };
    })();
</script>
<base target="_self">
`;
