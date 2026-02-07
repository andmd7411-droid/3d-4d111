/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                'section1': {
                    start: '#0066FF',
                    end: '#9933FF',
                },
                'section2': {
                    start: '#FF6B35',
                    end: '#FF006E',
                },
                'section3': {
                    start: '#00D9A3',
                    end: '#00B4D8',
                },
            },
        },
    },
    plugins: [],
}
