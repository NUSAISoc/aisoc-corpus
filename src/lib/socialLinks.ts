export interface SocialLink {
    readonly href: string;
    readonly label: string;
}

export const SOCIAL_LINKS = {
    telegramAlerts: {
        href: "https://t.me/nusaisociety",
        label: "Telegram",
    },
    github: {
        href: "https://github.com/NUSAISoc",
        label: "GitHub",
    },
    email: {
        href: "mailto:outreach@nusaisociety.org",
        label: "Email",
    },
    linkedin: {
        href: "https://www.linkedin.com/company/nus-computing-ai-society/",
        label: "LinkedIn",
    },
} as const satisfies Record<string, SocialLink>;
