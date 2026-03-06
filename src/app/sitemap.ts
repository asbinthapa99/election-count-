import { MetadataRoute } from 'next'

const SITE_URL = 'https://electioncount.asbinthapa.info.np'

export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date()

    return [
        {
            url: SITE_URL,
            lastModified,
            changeFrequency: 'always',
            priority: 1.0,
        },
        {
            url: `${SITE_URL}/key-races`,
            lastModified,
            changeFrequency: 'always',
            priority: 0.95,
        },
        {
            url: `${SITE_URL}/browse`,
            lastModified,
            changeFrequency: 'always',
            priority: 0.9,
        },
        {
            url: `${SITE_URL}/candidates`,
            lastModified,
            changeFrequency: 'always',
            priority: 0.9,
        },
        {
            url: `${SITE_URL}/popular`,
            lastModified,
            changeFrequency: 'always',
            priority: 0.9,
        },
        {
            url: `${SITE_URL}/constituencies`,
            lastModified,
            changeFrequency: 'always',
            priority: 0.85,
        },
        {
            url: `${SITE_URL}/elections`,
            lastModified,
            changeFrequency: 'hourly',
            priority: 0.8,
        },
        {
            url: `${SITE_URL}/predictions`,
            lastModified,
            changeFrequency: 'daily',
            priority: 0.7,
        },
        {
            url: `${SITE_URL}/discussion`,
            lastModified,
            changeFrequency: 'always',
            priority: 0.7,
        },
    ]
}
