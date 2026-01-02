import {useCallback, useRef, useState} from 'react';

export function useScrollManagement() {
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isAtBottom, setIsAtBottom] = useState(true);

    const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
        if (viewportRef.current) {
            viewportRef.current.scrollTo({
                top: viewportRef.current.scrollHeight,
                behavior,
            });
            setUnreadCount(0);
            setIsAtBottom(true);
        }
    }, []);

    const handleScroll = useCallback((position: {
        x: number;
        y: number
    }, nextCursor: string | null, onLoadOlder: (onScrollAdjust: (h: number) => void) => void) => {
        if (!viewportRef.current) return;

        if (viewportRef.current.scrollTop < 100 && nextCursor) {
            const scrollContainer = viewportRef.current;
            const prevScrollHeight = scrollContainer.scrollHeight;

            onLoadOlder(() => {
                setTimeout(() => {
                    const newScrollHeight = scrollContainer.scrollHeight;
                    scrollContainer.scrollTop = newScrollHeight - prevScrollHeight;
                }, 0);
            });
        }

        const {scrollHeight, clientHeight} = viewportRef.current;
        const isBottom = scrollHeight - position.y - clientHeight < 100;
        setIsAtBottom(isBottom);
        if (isBottom) {
            setUnreadCount(0);
        }
    }, []);

    const incrementUnread = useCallback(() => {
        setUnreadCount(c => c + 1);
    }, []);

    return {
        viewportRef,
        unreadCount,
        setUnreadCount,
        isAtBottom,
        setIsAtBottom,
        scrollToBottom,
        handleScroll,
        incrementUnread
    };
}
