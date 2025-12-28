import EmojiPickerReact, {type EmojiClickData, EmojiStyle, Theme} from 'emoji-picker-react';
import {useMantineColorScheme} from '@mantine/core';

interface EmojiPickerProps {
    onEmojiClick: (emojiData: EmojiClickData) => void;
}

export function EmojiPicker({onEmojiClick}: EmojiPickerProps) {
    const {colorScheme} = useMantineColorScheme();

    return (
        <EmojiPickerReact
            theme={colorScheme === 'dark' ? Theme.DARK : Theme.LIGHT}

            onEmojiClick={onEmojiClick}
            lazyLoadEmojis={true}
            emojiStyle={EmojiStyle.NATIVE}
            width={300}
            height={400}
        />
    );
}
