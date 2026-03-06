/**
 * API and app configuration.
 * Backend URL is relative when frontend is served from the same origin.
 */

function getBackendURL() {
    return '/api';
}

export const API_BASE_URL = getBackendURL();

let _backendAvailable = true;
export function getBackendAvailable() {
    return _backendAvailable;
}
export function setBackendAvailable(value) {
    _backendAvailable = value;
}
