// Global scroll utilities for the chat application

export const scrollToTop = () => {
    const messageList = document.querySelector('.overflow-y-auto');
    if (messageList) {
        messageList.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

export const scrollToBottom = () => {
    const messageList = document.querySelector('.overflow-y-auto');
    if (messageList) {
        messageList.scrollTo({ top: messageList.scrollHeight, behavior: 'smooth' });
    }
};

// Make functions available globally
if (typeof window !== 'undefined') {
    (window as any).scrollToTop = scrollToTop;
    (window as any).scrollToBottom = scrollToBottom;
}

export default {
    scrollToTop,
    scrollToBottom
};
