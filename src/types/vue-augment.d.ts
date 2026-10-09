export {};

declare module 'vue' {
    interface ComponentCustomProps {
        onClick?: (event: MouseEvent) => void;
    }
}
