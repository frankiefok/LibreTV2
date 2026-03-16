(function bootstrapLibreTV() {
    const SHARED_CONFIG_URL = '/config/shared-config.json';
    const FALLBACK_COVER_URL = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgcnk9IjIiPjwvcmVjdD48cGF0aCBkPSJNMjEgMTV2NGEyIDIgMCAwIDEtMiAySDVhMiAyIDAgMCAxLTItMnYtNCI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjE3IDggMTIgMyA3IDgiPjwvcG9seWxpbmU+PHBhdGggZD0iTTEyIDN2MTIiPjwvcGF0aD48L3N2Zz4=';

    function loadSharedConfigSync() {
        try {
            const request = new XMLHttpRequest();
            request.open('GET', SHARED_CONFIG_URL, false);
            request.overrideMimeType('application/json');
            request.send(null);

            if (request.status >= 200 && request.status < 300) {
                return JSON.parse(request.responseText);
            }

            console.warn(`[shared-config] Failed to load ${SHARED_CONFIG_URL}: ${request.status}`);
        } catch (error) {
            console.warn(`[shared-config] Unable to load ${SHARED_CONFIG_URL}:`, error);
        }

        return null;
    }

    function toStorageBoolean(value, fallbackValue) {
        if (typeof value === 'boolean') {
            return String(value);
        }

        if (value === 'true' || value === 'false') {
            return value;
        }

        return fallbackValue;
    }

    function applySharedConfig(sharedConfig) {
        if (!sharedConfig || typeof sharedConfig !== 'object') {
            return;
        }

        if (Array.isArray(sharedConfig.selectedAPIs)) {
            localStorage.setItem('selectedAPIs', JSON.stringify(sharedConfig.selectedAPIs));
        }

        if (Array.isArray(sharedConfig.customAPIs)) {
            localStorage.setItem('customAPIs', JSON.stringify(sharedConfig.customAPIs));
        }

        const settings = sharedConfig.settings && typeof sharedConfig.settings === 'object'
            ? sharedConfig.settings
            : {};

        const settingsMap = {
            yellowFilterEnabled: 'true',
            adFilteringEnabled: 'true',
            doubanEnabled: 'true',
            hasInitializedDefaults: 'true'
        };

        Object.entries(settingsMap).forEach(([key, fallbackValue]) => {
            if (settings[key] !== undefined) {
                localStorage.setItem(key, toStorageBoolean(settings[key], fallbackValue));
            }
        });

        window.__LIBRETV_SHARED_CONFIG__ = sharedConfig;
    }

    function getApiBaseUrl(item, sourceCode) {
        if (item && typeof item.api_url === 'string' && item.api_url.trim()) {
            return item.api_url.trim();
        }

        const resolvedSourceCode = sourceCode || item?.source_code;
        if (!resolvedSourceCode) {
            return '';
        }

        if (resolvedSourceCode.startsWith('custom_') && typeof window.getCustomApiInfo === 'function') {
            const customApi = window.getCustomApiInfo(resolvedSourceCode.replace('custom_', ''));
            return customApi?.url || '';
        }

        if (window.API_SITES && window.API_SITES[resolvedSourceCode]?.api) {
            return window.API_SITES[resolvedSourceCode].api;
        }

        return '';
    }

    function normalizeCoverUrl(rawUrl, baseUrl) {
        if (typeof rawUrl !== 'string') {
            return '';
        }

        const trimmedUrl = rawUrl.trim();
        if (!trimmedUrl) {
            return '';
        }

        if (trimmedUrl.startsWith('data:')) {
            return trimmedUrl;
        }

        if (trimmedUrl.startsWith('//')) {
            return `${window.location.protocol}${trimmedUrl}`;
        }

        try {
            const resolvedUrl = /^https?:\/\//i.test(trimmedUrl)
                ? trimmedUrl
                : new URL(trimmedUrl, baseUrl || window.location.origin).toString();

            if (window.location.protocol === 'https:' && resolvedUrl.startsWith('http://')) {
                return resolvedUrl.replace(/^http:\/\//i, 'https://');
            }

            return resolvedUrl;
        } catch {
            return '';
        }
    }

    function buildCoverUrl(item, sourceCode) {
        const coverSource = item?.vod_pic || item?.cover || '';
        const baseUrl = getApiBaseUrl(item, sourceCode);
        return normalizeCoverUrl(coverSource, baseUrl);
    }

    const sharedConfig = loadSharedConfigSync();
    applySharedConfig(sharedConfig);

    window.LibreTVUtils = {
        buildCoverUrl,
        fallbackCoverUrl: FALLBACK_COVER_URL,
        normalizeCoverUrl
    };
})();
