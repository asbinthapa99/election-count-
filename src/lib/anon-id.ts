import { v4 as uuidv4 } from 'uuid'

const ANON_ID_KEY = 'nepal_pulse_anon_id'

export function getAnonId(): string {
    if (typeof window === 'undefined') return ''

    let id = localStorage.getItem(ANON_ID_KEY)
    if (!id) {
        id = uuidv4()
        localStorage.setItem(ANON_ID_KEY, id)
        // Backup in cookie (365 days)
        document.cookie = `${ANON_ID_KEY}=${id}; max-age=${365 * 24 * 60 * 60}; path=/; SameSite=Lax`
    }
    return id
}

export function getAnonIdFromCookie(): string | null {
    if (typeof document === 'undefined') return null
    const match = document.cookie.match(new RegExp(`${ANON_ID_KEY}=([^;]+)`))
    return match ? match[1] : null
}

// Recover anon_id from cookie if localStorage was cleared
export function ensureAnonId(): string {
    if (typeof window === 'undefined') return ''

    let id = localStorage.getItem(ANON_ID_KEY)
    if (!id) {
        id = getAnonIdFromCookie()
        if (id) {
            localStorage.setItem(ANON_ID_KEY, id)
        } else {
            id = uuidv4()
            localStorage.setItem(ANON_ID_KEY, id)
            document.cookie = `${ANON_ID_KEY}=${id}; max-age=${365 * 24 * 60 * 60}; path=/; SameSite=Lax`
        }
    }
    return id
}
