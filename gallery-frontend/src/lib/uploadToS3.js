/**
 * PUT a file to a presigned S3 URL (direct to S3 in dev and production).
 */
export async function uploadFileToPresignedUrl(file, s3Url) {
  const contentType = file.type || 'application/octet-stream'

  if (/\.s3\.eu-east-1\./i.test(s3Url)) {
    throw new Error(
      'Invalid presigned URL: eu-east-1 is not a valid AWS region. Set upload Lambda S3Client region to us-east-1 for bucket gallery-pictures-36ecc062.',
    )
  }

  try {
    const putRes = await fetch(s3Url, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: file,
    })

    if (!putRes.ok) {
      throw new Error(await readUploadFailure(putRes))
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('eu-east-1')) {
      throw err
    }
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error(
        'Upload request failed before S3 responded. Usually the presigned URL has the wrong region (check upload Lambda uses us-east-1), or S3 CORS is missing for PUT from http://localhost:5173.',
        { cause: err },
      )
    }
    throw err
  }
}

async function readUploadFailure(res) {
  const detail = await res.text().catch(() => '')
  let message = `S3 upload failed (${res.status}).`

  if (res.status === 301) {
    message +=
      ' The presigned URL targets the wrong S3 region — set the upload Lambda S3Client region to match your bucket.'
  } else if (res.status === 403) {
    message += ' Check S3 bucket CORS for PUT and Lambda s3:PutObject permissions.'
  }

  return detail ? `${message} ${detail.slice(0, 160)}` : message
}
