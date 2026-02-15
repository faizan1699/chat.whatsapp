export const screenWidthChecker = (width: number = 768) => {
    return typeof window !== 'undefined' && window.innerWidth >= width;
};
