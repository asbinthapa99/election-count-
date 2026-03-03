import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// GET: List constituencies with filters
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const province = searchParams.get('province')
    const district = searchParams.get('district')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '15'), 50)
    const offset = (page - 1) * limit

    try {
        const supabase = createServerClient()

        let query = supabase
            .from('constituencies')
            .select('*', { count: 'exact' })
            .order('province_number')
            .order('name')
            .range(offset, offset + limit - 1)

        if (province && province !== 'all') {
            query = query.eq('province', province)
        }
        if (district && district !== 'all') {
            query = query.eq('district', district)
        }
        if (search) {
            query = query.or(`name.ilike.%${search}%,district.ilike.%${search}%`)
        }

        const { data, error, count } = await query

        if (error) {
            console.error('Constituencies fetch error:', error)
            return NextResponse.json({ constituencies: [], total: 0, page, limit })
        }

        return NextResponse.json({
            constituencies: data || [],
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
        })
    } catch (err) {
        console.error('Constituencies API error:', err)
        return NextResponse.json({ constituencies: [], total: 0, page, limit })
    }
}
