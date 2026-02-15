declare module 'emoji-picker-react' {
    import React from 'react';

    export enum EmojiStyle {
        NATIVE = 'native',
        APPLE = 'apple',
        TWITTER = 'twitter',
        GOOGLE = 'google',
        FACEBOOK = 'facebook'
    }

    export enum Theme {
        LIGHT = 'light',
        DARK = 'dark',
        AUTO = 'auto'
    }

    export interface PickerProps {
        onEmojiClick?: (emojiData: any, event: MouseEvent) => void;
        autoFocusSearch?: boolean;
        theme?: Theme;
        emojiStyle?: EmojiStyle;
        previewConfig?: {
            showPreview?: boolean;
        };
        width?: number | string;
        height?: number | string;
        lazyLoadEmojis?: boolean;
        [key: string]: any;
    }

    const EmojiPicker: React.FC<PickerProps>;
    export default EmojiPicker;
}
