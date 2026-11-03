import { NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { isAdminAuthenticated } from '@/lib/auth'

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        if (!isAdminAuthenticated()) {
          throw new Error('Unauthorized')
        }
        return {
          addRandomSuffix: true,
          maximumSizeInBytes: 500 * 1024 * 1024, // Up to 500 MB
        }
      },
      onUploadCompleted: async () => {
        // Optional post-upload hook
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    )
  }
}
