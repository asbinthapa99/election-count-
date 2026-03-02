import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// GET: Get all parties with optional election results
export async function GET() {
    const supabase = createServerClient()

    const { data, error } = await supabase
        .from('parties')
        .select('*')
        .order('name_en')

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}
