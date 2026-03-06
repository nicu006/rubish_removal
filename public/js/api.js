/**
 * Backend API calls for messages and health.
 */

import { API_BASE_URL, setBackendAvailable } from './config.js';

export async function saveMessageToBackend(messageData) {
    const url = API_BASE_URL.startsWith('/')
        ? `${window.location.origin}${API_BASE_URL}/messages`
        : `${API_BASE_URL}/messages`;

    const requestBody = {
        timestamp: messageData.timestamp,
        data: messageData.data,
        read: false
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(requestBody),
            mode: 'cors',
            credentials: 'omit',
            signal: controller.signal,
            cache: 'no-cache',
            redirect: 'follow'
        });
        clearTimeout(timeoutId);

        const responseText = await response.text();

        if (!response.ok) {
            let errorData;
            try {
                errorData = JSON.parse(responseText);
            } catch (e) {
                errorData = { error: responseText || `HTTP ${response.status}: ${response.statusText}` };
            }
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = JSON.parse(responseText);
        setBackendAvailable(true);
        return result;
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Error saving to backend:', error);

        let userErrorMessage = 'Error saving message please try again';
        if (error.name === 'AbortError') {
            userErrorMessage = 'Request timeout. Server took too long to respond. Check server and network.';
        } else if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('Load failed') || error.message.includes('Failed to fetch'))) {
            userErrorMessage = 'Cannot connect to server. Check server and network.';
        } else {
            userErrorMessage = error.message || 'Unknown error';
        }
        setBackendAvailable(false);
        throw new Error(userErrorMessage);
    }
}

export async function getAllMessagesFromDatabase() {
    try {
        const url = API_BASE_URL.startsWith('/')
            ? `${window.location.origin}${API_BASE_URL}/messages`
            : `${API_BASE_URL}/messages`;
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            throw new Error(errBody.error || 'Failed to fetch messages');
        }

        const data = await response.json();
        setBackendAvailable(true);
        return data.messages !== undefined ? data.messages : data;
    } catch (error) {
        console.error('Error reading from backend:', error);
        setBackendAvailable(false);
        throw error;
    }
}

export async function updateMessageReadStatus(id, read) {
    try {
        const url = API_BASE_URL.startsWith('/')
            ? `${window.location.origin}${API_BASE_URL}/messages/${id}`
            : `${API_BASE_URL}/messages/${id}`;
        const response = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ read })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to update message');
        }
        setBackendAvailable(true);
        return true;
    } catch (error) {
        console.error('Error updating message status:', error);
        setBackendAvailable(false);
        throw error;
    }
}

export async function deleteMessageFromDatabase(id) {
    try {
        const url = API_BASE_URL.startsWith('/')
            ? `${window.location.origin}${API_BASE_URL}/messages/${id}`
            : `${API_BASE_URL}/messages/${id}`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to delete message');
        }
        setBackendAvailable(true);
        return true;
    } catch (error) {
        console.error('Error deleting message:', error);
        setBackendAvailable(false);
        throw error;
    }
}
