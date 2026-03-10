const CrescentMoon = ({ className = "" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none">
        <defs>
            <linearGradient id="moonGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(45, 90%, 70%)" />
                <stop offset="50%" stopColor="hsl(45, 80%, 55%)" />
                <stop offset="100%" stopColor="hsl(40, 70%, 40%)" />
            </linearGradient>
        </defs>
        <path
            d="M50 5C30 5 13 22 13 42c0 20 17 37 37 37 8 0 16-3 22-8-5 3-11 5-17 5-20 0-37-17-37-37 0-15 9-28 22-34C47 5 48 5 50 5z"
            fill="url(#moonGold)"
        />
        <circle cx="70" cy="20" r="3" fill="url(#moonGold)" />
        <circle cx="80" cy="35" r="2" fill="url(#moonGold)" />
        <circle cx="75" cy="50" r="2.5" fill="url(#moonGold)" />
    </svg>
);

export default CrescentMoon;
