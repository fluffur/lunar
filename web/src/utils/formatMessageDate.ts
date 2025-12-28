export const formatMessageDate = (date?: string) => {
    if (!date) return "";

    const d = new Date(date);
    const now = new Date();

    const isToday = d.toDateString() === now.toDateString();

    const isYesterday = d.getDate() === now.getDate() - 1 &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

    if (isToday) {
        return d.toLocaleTimeString(navigator.language, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } else if (isYesterday) {
        return `Yesterday, ${d.toLocaleTimeString(navigator.language, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })}`;
    } else {
        return d.toLocaleString(navigator.language, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }
};