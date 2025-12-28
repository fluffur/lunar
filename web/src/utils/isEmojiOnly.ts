import emojiRegex from 'emoji-regex';

export function isEmojiOnly(text: string): boolean {
    if (!text.trim()) return false;

    const cleanText = text.replace(/\s/g, '');

    const regex = emojiRegex();
    const matches = cleanText.match(regex);

    if (!matches) return false;

    return matches.join('') === cleanText;
}
